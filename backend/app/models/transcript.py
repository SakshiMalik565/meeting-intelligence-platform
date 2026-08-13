"""TranscriptSegment model — one speaker turn in a meeting transcript.

Each segment captures who spoke, when (relative to meeting start), and what
they said. Segments are ordered by `order_index` and indexed on `meeting_id`
for fast retrieval of an entire transcript.
"""

import uuid

from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.meeting import Meeting


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    meeting_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("meetings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,  # Required by spec for fast transcript lookup
    )
    speaker_name: Mapped[str] = mapped_column(String(255), nullable=False)
    # Float for sub-second precision in timestamp display
    start_time_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    end_time_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    meeting: Mapped["Meeting"] = relationship(back_populates="transcript_segments")
