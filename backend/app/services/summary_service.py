"""Summary generation service — routes to a real LLM or a deterministic mock.

The public API is a single function:
    generate_summary(transcript_text) -> SummaryResult

If `settings.LLM_API_KEY` is non-empty the function calls the configured LLM;
otherwise it falls back to a fully-offline mock generator so the app is
demoable without any external API key.

Both paths return the exact same `SummaryResult` shape so callers never need
to know which path ran.
"""

from __future__ import annotations

import json
import re
import urllib.request
import urllib.error
from collections import Counter
from dataclasses import dataclass, field
from typing import Any

from app.config import settings

# ── Result shape (shared by mock and LLM paths) ───────────────────


@dataclass
class SummaryResult:
    """Uniform return type for every summary generator."""

    overview: str
    key_topics: list[str]
    action_items: list[dict[str, Any]] = field(default_factory=list)
    # Each action_item dict: {"text": str, "assignee_name": str | None}


# ── Public entry point ─────────────────────────────────────────────


def generate_summary(transcript_text: str) -> SummaryResult:
    """Generate a meeting summary from raw transcript text.

    Routes to the LLM path if an API key is configured, otherwise uses the
    deterministic mock generator.
    """
    if settings.LLM_API_KEY:
        return _llm_generate(transcript_text)
    return _mock_generate(transcript_text)


# ═══════════════════════════════════════════════════════════════════
# MOCK GENERATOR  (zero external dependencies)
# ═══════════════════════════════════════════════════════════════════

# Common English stop words filtered out when extracting key topics.
_STOPWORDS: frozenset[str] = frozenset(
    {
        "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "will", "would", "shall",
        "should", "may", "might", "must", "can", "could", "i", "you", "he",
        "she", "it", "we", "they", "me", "him", "her", "us", "them", "my",
        "your", "his", "its", "our", "their", "this", "that", "these",
        "those", "and", "but", "or", "nor", "not", "so", "yet", "both",
        "either", "neither", "each", "every", "all", "any", "few", "more",
        "most", "other", "some", "such", "no", "only", "own", "same",
        "than", "too", "very", "just", "because", "as", "until", "while",
        "of", "at", "by", "for", "with", "about", "against", "between",
        "through", "during", "before", "after", "above", "below", "to",
        "from", "up", "down", "in", "out", "on", "off", "over", "under",
        "again", "further", "then", "once", "here", "there", "when",
        "where", "why", "how", "what", "which", "who", "whom", "if",
        "also", "let", "know", "think", "going", "want", "get", "got",
        "like", "yeah", "okay", "right", "well", "thing", "things",
        "really", "actually", "one", "two", "three", "make", "sure",
        "much", "lot", "say", "said", "look", "take", "see", "come",
        "go", "good", "new", "way", "back", "need", "time", "work",
        "great", "start", "people", "team", "don", "didn", "doesn",
        "won", "wouldn", "couldn", "shouldn", "haven", "hasn", "hadn",
        "aren", "isn", "weren", "wasn", "into", "already", "still",
    }
)

# Keywords that signal an actionable line in the transcript.
_ACTION_KEYWORDS: list[str] = [
    "should", "will", "need to", "must", "let's", "going to",
    "please", "make sure", "follow up", "schedule", "set up",
    "create", "prepare", "update", "send", "review", "assign",
    "deadline", "complete", "deliver", "draft", "finalize",
]


def _mock_generate(transcript_text: str) -> SummaryResult:
    """Deterministic summary generator that works fully offline.

    Strategy:
      - Overview: synthesise from the first and last substantive lines.
      - Key topics: extract the most frequent meaningful bigrams.
      - Action items: find lines containing action-triggering language.
    """
    lines = [l.strip() for l in transcript_text.strip().splitlines() if l.strip()]

    if not lines:
        return SummaryResult(
            overview="No transcript content available for summarization.",
            key_topics=["General Discussion"],
        )

    overview = _build_overview(lines)
    key_topics = _extract_key_topics(transcript_text, n=5)
    action_items = _extract_action_items(lines)

    return SummaryResult(
        overview=overview,
        key_topics=key_topics if key_topics else ["General Discussion"],
        action_items=action_items,
    )


def _build_overview(lines: list[str]) -> str:
    """Create a naive overview from the first and last substantive lines."""
    # Filter very short lines — they tend to be greetings / filler
    substantive = [l for l in lines if len(l) > 40]
    if not substantive:
        substantive = lines

    if len(substantive) >= 3:
        mid = substantive[len(substantive) // 2]
        return (
            f"The discussion covered several topics. "
            f"{substantive[0]} "
            f"A key point raised was: {mid} "
            f"The meeting concluded with: {substantive[-1]}"
        )
    return " ".join(substantive[:3])


def _extract_key_topics(text: str, n: int = 5) -> list[str]:
    """Return the *n* most frequent meaningful bigrams in *text*."""
    words = re.findall(r"\b[a-z]{3,}\b", text.lower())
    meaningful = [w for w in words if w not in _STOPWORDS]

    if len(meaningful) < 2:
        return ["General Discussion"]

    bigrams = [
        f"{meaningful[i]} {meaningful[i + 1]}" for i in range(len(meaningful) - 1)
    ]
    return [phrase.title() for phrase, _ in Counter(bigrams).most_common(n)]


def _extract_action_items(lines: list[str]) -> list[dict[str, Any]]:
    """Find lines containing action-triggering keywords."""
    seen: set[str] = set()
    items: list[dict[str, Any]] = []

    for line in lines:
        lower = line.lower()
        if any(kw in lower for kw in _ACTION_KEYWORDS):
            # Rough deduplication on first 60 chars
            key = lower[:60]
            if key not in seen:
                seen.add(key)
                items.append({"text": line, "assignee_name": None})

    return items[:6]  # cap to avoid overwhelming the UI


# ═══════════════════════════════════════════════════════════════════
# LLM GENERATOR  (requires LLM_API_KEY)
# ═══════════════════════════════════════════════════════════════════

_LLM_SYSTEM_PROMPT = (
    "You are a meeting summarisation assistant. Given a meeting transcript, "
    "produce a JSON object with exactly three keys:\n"
    '  "overview": a 2-3 sentence summary of the meeting,\n'
    '  "key_topics": a list of 3-5 short topic strings,\n'
    '  "action_items": a list of objects with "text" (string) and '
    '"assignee_name" (string or null).\n'
    "Return ONLY valid JSON, no markdown fences or commentary."
)


def _llm_generate(transcript_text: str) -> SummaryResult:
    """Call an OpenAI-compatible chat-completions endpoint.

    Uses stdlib urllib so we don't add an external dependency.
    Falls back to mock on any failure so the app never breaks.
    """
    # Truncate very long transcripts to stay within context limits
    truncated = transcript_text[:12000]

    payload = json.dumps(
        {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": _LLM_SYSTEM_PROMPT},
                {"role": "user", "content": truncated},
            ],
            "temperature": 0.3,
        }
    ).encode()

    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.LLM_API_KEY}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = json.loads(resp.read().decode())

        raw = body["choices"][0]["message"]["content"]
        # Strip markdown code fences if the model wrapped the JSON
        raw = re.sub(r"^```(?:json)?\s*", "", raw.strip())
        raw = re.sub(r"\s*```$", "", raw.strip())
        parsed = json.loads(raw)

        return SummaryResult(
            overview=parsed.get("overview", ""),
            key_topics=parsed.get("key_topics", ["General Discussion"]),
            action_items=parsed.get("action_items", []),
        )

    except Exception:
        # Any network / parsing / API error → fall back to mock so the app
        # never breaks just because an external service is down.
        return _mock_generate(transcript_text)
