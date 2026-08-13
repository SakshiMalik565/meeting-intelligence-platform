"""Tag model and the meeting_tags association table (bonus feature).

Tags provide a lightweight categorization system for meetings. The M2M join
table uses cascade deletes so removing a meeting cleans up its tag links.
"""

import uuid

from sqlalchemy import Column, ForeignKey, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.meeting import Meeting

# ── Association table for the Meeting ↔ Tag M2M relationship ───────────
meeting_tags = Table(
    "meeting_tags",
    Base.metadata,
    Column(
        "meeting_id",
        String(36),
        ForeignKey("meetings.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        String(36),
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    meetings: Mapped[list["Meeting"]] = relationship(
        secondary=meeting_tags, back_populates="tags"
    )
