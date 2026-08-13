"""Pydantic schemas for transcript search with highlight match positions.

The frontend uses the {start_char, end_char} ranges to render highlighted
text spans within each transcript segment.
"""

from pydantic import BaseModel


class TranscriptMatch(BaseModel):
    """Character range of a single search match within a segment's text."""

    start_char: int
    end_char: int


class TranscriptSegmentWithMatches(BaseModel):
    """Transcript segment augmented with search match positions."""

    id: str
    speaker_name: str
    start_time_seconds: float
    end_time_seconds: float
    text: str
    order_index: int
    matches: list[TranscriptMatch] = []

    model_config = {"from_attributes": True}


class TranscriptSearchResponse(BaseModel):
    """Response for GET /meetings/{id}/transcript?query=."""

    segments: list[TranscriptSegmentWithMatches]
    match_count: int
