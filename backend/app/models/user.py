"""User model — represents an app user.

In this demo, a single hardcoded user is seeded and returned by /api/v1/me.
The model is still fully normalized to support multi-user expansion.
"""

import uuid

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.meeting import Meeting


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # One user can host many meetings
    hosted_meetings: Mapped[list["Meeting"]] = relationship(
        back_populates="host", cascade="all, delete-orphan"
    )
