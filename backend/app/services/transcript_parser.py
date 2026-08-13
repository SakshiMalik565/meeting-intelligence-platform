"""Transcript file parser — handles .txt, .vtt, and .json input formats.

Each parser returns a list of segment dicts ready for bulk-inserting as
TranscriptSegment rows. All parsers guarantee:
  - order_index is set sequentially starting from 0
  - start_time_seconds / end_time_seconds are floats
  - speaker_name falls back to "Unknown Speaker" when not determinable
"""

from __future__ import annotations

import json
import re

from pydantic import BaseModel, ValidationError


# ── JSON format validation model ───────────────────────────────────


class _JsonSegmentSchema(BaseModel):
    """Expected shape for each object in a .json transcript upload."""

    speaker: str
    start: float
    end: float
    text: str


# ── Public entry point ─────────────────────────────────────────────


def parse_transcript(
    content: str,
    filename: str | None = None,
) -> list[dict]:
    """Route to the correct format-specific parser.

    If *filename* is provided its extension determines the parser. Otherwise
    the function tries JSON first, then falls back to the .txt parser (which
    has its own graceful fallback for unstructured text).
    """
    if filename:
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext == "vtt":
            return _parse_vtt(content)
        if ext == "json":
            return _parse_json(content)
        # .txt or any other extension → txt parser
        return _parse_txt(content)

    # No filename → try JSON first, fall back to txt
    try:
        return _parse_json(content)
    except ValueError:
        return _parse_txt(content)


# ── .txt parser ────────────────────────────────────────────────────

# Matches lines like: Speaker Name [00:01:23]: Hello everyone...
_TXT_LINE_RE = re.compile(
    r"^(.+?)\s*\[(\d{1,2}:\d{2}:\d{2})\]:\s*(.+)$"
)


def _ts_to_seconds(ts: str) -> float:
    """Convert HH:MM:SS or H:MM:SS to seconds."""
    parts = list(map(int, ts.split(":")))
    return float(parts[0] * 3600 + parts[1] * 60 + parts[2])


def _parse_txt(content: str) -> list[dict]:
    """Parse plain-text transcript.

    Expected format per line:
        Speaker Name [HH:MM:SS]: Spoken text here...

    If no lines match the pattern the entire content is treated as a single
    unlabeled segment so the import never errors out on free-form text.
    """
    segments: list[dict] = []

    for line in content.strip().splitlines():
        line = line.strip()
        if not line:
            continue
        match = _TXT_LINE_RE.match(line)
        if match:
            speaker, timestamp, text = match.groups()
            start = _ts_to_seconds(timestamp)
            segments.append(
                {
                    "speaker_name": speaker.strip(),
                    "start_time_seconds": start,
                    "end_time_seconds": start,  # fixed up below
                    "text": text.strip(),
                    "order_index": len(segments),
                }
            )

    # Graceful fallback: treat the whole file as one unlabeled block
    if not segments:
        segments.append(
            {
                "speaker_name": "Unknown Speaker",
                "start_time_seconds": 0.0,
                "end_time_seconds": 0.0,
                "text": content.strip(),
                "order_index": 0,
            }
        )
        return segments

    # Fix end times: each segment ends when the next one starts.
    # Last segment gets +30 s as a reasonable estimate.
    for i in range(len(segments) - 1):
        segments[i]["end_time_seconds"] = segments[i + 1]["start_time_seconds"]
    segments[-1]["end_time_seconds"] = segments[-1]["start_time_seconds"] + 30.0

    return segments


# ── .vtt parser ────────────────────────────────────────────────────

_VTT_TS_RE = re.compile(
    r"(\d{2}:\d{2}:\d{2}[.,]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[.,]\d{3})"
)
_VTT_VOICE_RE = re.compile(r"<v\s+([^>]+)>")


def _vtt_ts_to_seconds(ts: str) -> float:
    """Convert WebVTT timestamp (HH:MM:SS.mmm) to seconds."""
    ts = ts.replace(",", ".")
    parts = ts.split(":")
    return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])


def _parse_vtt(content: str) -> list[dict]:
    """Parse a WebVTT file into transcript segments.

    Handles optional <v Speaker> voice tags and strips any remaining HTML.
    Raises ValueError if the content is not valid WebVTT.
    """
    content = content.lstrip("\ufeff").strip()  # strip BOM
    if not content.upper().startswith("WEBVTT"):
        raise ValueError("Invalid WebVTT: missing WEBVTT header")

    blocks = re.split(r"\n\n+", content)
    segments: list[dict] = []

    for block in blocks[1:]:  # skip the WEBVTT header block
        lines = block.strip().splitlines()
        if not lines:
            continue

        # Find the timestamp line
        ts_match = None
        text_start_idx = 0
        for i, line in enumerate(lines):
            m = _VTT_TS_RE.match(line)
            if m:
                ts_match = m
                text_start_idx = i + 1
                break

        if not ts_match:
            continue  # skip cue identifier lines or malformed blocks

        start = _vtt_ts_to_seconds(ts_match.group(1))
        end = _vtt_ts_to_seconds(ts_match.group(2))
        raw_text = " ".join(lines[text_start_idx:]).strip()

        # Extract speaker from <v Speaker Name> tags
        voice_match = _VTT_VOICE_RE.search(raw_text)
        speaker = voice_match.group(1).strip() if voice_match else "Unknown Speaker"

        # Strip all HTML-like tags
        clean_text = re.sub(r"<[^>]+>", "", raw_text).strip()

        if clean_text:
            segments.append(
                {
                    "speaker_name": speaker,
                    "start_time_seconds": start,
                    "end_time_seconds": end,
                    "text": clean_text,
                    "order_index": len(segments),
                }
            )

    if not segments:
        raise ValueError("No valid cue blocks found in WebVTT content")

    return segments


# ── .json parser ───────────────────────────────────────────────────


def _parse_json(content: str) -> list[dict]:
    """Parse a JSON transcript — expects [{speaker, start, end, text}, ...].

    Validates each object against _JsonSegmentSchema and raises ValueError
    (mapped to HTTP 400 by the caller) on any structural or type issue.
    """
    try:
        data = json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid JSON: {exc}") from exc

    if not isinstance(data, list):
        raise ValueError("JSON transcript must be a list of segment objects")

    if not data:
        raise ValueError("JSON transcript is empty")

    segments: list[dict] = []
    for i, item in enumerate(data):
        try:
            validated = _JsonSegmentSchema(**item)
        except (ValidationError, TypeError) as exc:
            raise ValueError(f"Invalid segment at index {i}: {exc}") from exc

        segments.append(
            {
                "speaker_name": validated.speaker,
                "start_time_seconds": validated.start,
                "end_time_seconds": validated.end,
                "text": validated.text,
                "order_index": i,
            }
        )

    return segments
