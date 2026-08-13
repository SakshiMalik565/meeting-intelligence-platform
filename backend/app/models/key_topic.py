"""KeyTopic model — extracted key discussion points from a meeting.

Topics are ordered by `order_index` to preserve the sequence they appeared
in the transcript or were ranked by the summary generator.
"""

import uuid

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.meeting import Meeting


class KeyTopic(Base):
    __tablename__ = "key_topics"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    meeting_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False
    )
    topic_text: Mapped[str] = mapped_column(String(500), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    meeting: Mapped["Meeting"] = relationship(back_populates="key_topics")
