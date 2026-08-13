"""Summary model — AI-generated overview for a meeting (1:1 with meetings).

The unique constraint on meeting_id enforces the 1:1 relationship at the DB
level. Regenerating a summary replaces the existing row rather than appending.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.meeting import Meeting


class Summary(Base):
    __tablename__ = "summaries"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    meeting_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("meetings.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # Enforces 1:1 at the DB level
    )
    overview_text: Mapped[str] = mapped_column(Text, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    meeting: Mapped["Meeting"] = relationship(back_populates="summary")
