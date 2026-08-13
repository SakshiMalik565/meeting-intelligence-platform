"""Pydantic schemas for global search results.

Results are grouped by match type (title vs transcript) so the frontend
can render them in distinct sections with appropriate context snippets.
"""

from datetime import datetime

from pydantic import BaseModel


class SearchMeetingResult(BaseModel):
    """A single meeting that matched the search query."""

    meeting_id: str
    title: str
    date: datetime
    match_type: str  # "title" or "transcript"
    snippet: str | None = None  # Matching transcript excerpt, if applicable


class SearchResponse(BaseModel):
    """Response for GET /search?query=."""

    results: list[SearchMeetingResult]
    total: int
    query: str
