"""Meeting model — the central entity linking all meeting artifacts.

Every child table (transcript_segments, summaries, key_topics, action_items)
cascades on delete so removing a meeting cleans up all related data.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from app.db.base import Base
from app.models.participant import meeting_participants

if TYPE_CHECKING:
    from app.models.action_item import ActionItem
    from app.models.key_topic import KeyTopic
    from app.models.participant import Participant
    from app.models.summary import Summary
    from app.models.tag import Tag
    from app.models.transcript import TranscriptSegment
    from app.models.user import User


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    # Indexed for date-range filtering and sort-by-recent
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    host_user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    media_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # ── Relationships ──────────────────────────────────────────────────
    host: Mapped["User"] = relationship(back_populates="hosted_meetings")

    participants: Mapped[list["Participant"]] = relationship(
        secondary=meeting_participants, back_populates="meetings"
    )

    transcript_segments: Mapped[list["TranscriptSegment"]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="TranscriptSegment.order_index",
    )

    # uselist=False enforces the 1:1 relationship at the ORM level
    summary: Mapped["Summary | None"] = relationship(
        back_populates="meeting", cascade="all, delete-orphan", uselist=False
    )

    key_topics: Mapped[list["KeyTopic"]] = relationship(
        back_populates="meeting",
        cascade="all, delete-orphan",
        order_by="KeyTopic.order_index",
    )

    action_items: Mapped[list["ActionItem"]] = relationship(
        back_populates="meeting", cascade="all, delete-orphan"
    )

    # Bonus: tags via M2M join table (string reference avoids circular import)
    tags: Mapped[list["Tag"]] = relationship(
        secondary="meeting_tags", back_populates="meetings"
    )
