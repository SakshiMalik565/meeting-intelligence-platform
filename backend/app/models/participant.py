"""Participant model and the meeting_participants association table.

Participants are separate from Users because meeting attendees may not
have accounts in the system (e.g. external guests). The M2M join table
enables efficient participant-based meeting filtering.
"""

import uuid

from sqlalchemy import Column, ForeignKey, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.meeting import Meeting

# ── Association table for the Meeting ↔ Participant M2M relationship ──
meeting_participants = Table(
    "meeting_participants",
    Base.metadata,
    Column(
        "meeting_id",
        String(36),
        ForeignKey("meetings.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "participant_id",
        String(36),
        ForeignKey("participants.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Participant(Base):
    __tablename__ = "participants"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # A participant can attend many meetings
    meetings: Mapped[list["Meeting"]] = relationship(
        secondary=meeting_participants, back_populates="participants"
    )
