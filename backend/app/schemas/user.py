"""Pydantic schemas for the User model.

Separating schemas from ORM models keeps validation/serialization logic
independent of the database layer — a clean boundary for the API.
"""

from pydantic import BaseModel


class UserResponse(BaseModel):
    """Public-facing user representation returned by /api/v1/me."""

    id: str
    name: str
    email: str
    avatar_url: str | None = None

    model_config = {"from_attributes": True}
