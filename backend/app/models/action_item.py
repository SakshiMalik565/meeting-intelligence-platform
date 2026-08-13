"""ActionItem model — tasks extracted from or manually added to a meeting.

Each action item has optional assignee and completion tracking, supporting
the checklist UI on the meeting detail page.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.meeting import Meeting


class ActionItem(Base):
    __tablename__ = "action_items"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    meeting_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    assignee_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    meeting: Mapped["Meeting"] = relationship(back_populates="action_items")
