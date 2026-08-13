"""Re-export all models so Alembic autogenerate and Base.metadata discover them.

Import this package (e.g. `from app.models import User`) anywhere you need
model classes. Importing this module is also required before calling
`Base.metadata.create_all()` so all tables are registered.
"""

from app.models.user import User
from app.models.meeting import Meeting
from app.models.participant import Participant, meeting_participants
from app.models.transcript import TranscriptSegment
from app.models.summary import Summary
from app.models.key_topic import KeyTopic
from app.models.action_item import ActionItem
from app.models.tag import Tag, meeting_tags

__all__ = [
    "User",
    "Meeting",
    "Participant",
    "meeting_participants",
    "TranscriptSegment",
    "Summary",
    "KeyTopic",
    "ActionItem",
    "Tag",
    "meeting_tags",
]
