"""Pydantic schemas for Meetings and related entities.

Each schema is purpose-built for its API context (list vs detail, create vs
response) to keep payloads lean and validation tight.
"""

from datetime import datetime

from pydantic import BaseModel


# ── Nested schemas used inside meeting responses ───────────────────────


class ParticipantResponse(BaseModel):
    """Participant as embedded in meeting responses."""

    id: str
    name: str
    email: str | None = None

    model_config = {"from_attributes": True}


class TranscriptSegmentResponse(BaseModel):
    """Single transcript turn — speaker, timestamp range, and text."""

    id: str
    speaker_name: str
    start_time_seconds: float
    end_time_seconds: float
    text: str
    order_index: int

    model_config = {"from_attributes": True}


class SummaryResponse(BaseModel):
    """AI-generated meeting summary."""

    id: str
    overview_text: str
    generated_at: datetime

    model_config = {"from_attributes": True}


class KeyTopicResponse(BaseModel):
    """Key discussion topic extracted from the meeting."""

    id: str
    topic_text: str
    order_index: int

    model_config = {"from_attributes": True}


class ActionItemResponse(BaseModel):
    """Actionable task from a meeting with completion status."""

    id: str
    meeting_id: str
    text: str
    assignee_name: str | None = None
    is_completed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Meeting list response (lightweight, no transcript) ─────────────────


class MeetingListResponse(BaseModel):
    """Compact meeting card for the dashboard list/grid view."""

    id: str
    title: str
    date: datetime
    duration_seconds: int
    media_url: str | None = None
    participants: list[ParticipantResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class PaginatedMeetingsResponse(BaseModel):
    """Paginated wrapper for meeting lists."""

    items: list[MeetingListResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


# ── Mutation request schemas ───────────────────────────────────────


class MeetingUpdateRequest(BaseModel):
    """Body for PATCH /meetings/{id}. Only title and participants are editable."""

    title: str | None = None
    participant_names: list[str] | None = None


# ── Meeting detail response (full, with all nested data) ──────────────


class MeetingDetailResponse(BaseModel):
    """Full meeting view including transcript, summary, and action items."""

    id: str
    title: str
    date: datetime
    duration_seconds: int
    host_user_id: str
    media_url: str | None = None
    participants: list[ParticipantResponse] = []
    transcript_segments: list[TranscriptSegmentResponse] = []
    summary: SummaryResponse | None = None
    key_topics: list[KeyTopicResponse] = []
    action_items: list[ActionItemResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
