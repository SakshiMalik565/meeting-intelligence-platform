"""Pydantic schemas for action item create/update requests.

Response schema lives in schemas/meeting.py since ActionItemResponse is also
used as a nested field inside MeetingDetailResponse.
"""

from pydantic import BaseModel, Field


class ActionItemCreateRequest(BaseModel):
    """Body for POST /meetings/{id}/action-items."""

    text: str = Field(..., min_length=1, description="Action item description")
    assignee_name: str | None = Field(None, description="Person responsible")


class ActionItemUpdateRequest(BaseModel):
    """Body for PATCH /action-items/{id}. All fields optional — send only what changed."""

    text: str | None = Field(None, min_length=1)
    assignee_name: str | None = None
    is_completed: bool | None = None
