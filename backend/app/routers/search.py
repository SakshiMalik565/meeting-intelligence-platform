"""Search router — implements global multi-entity search.

Endpoints:
    - GET /api/v1/search?query=
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models import Meeting, TranscriptSegment
from app.schemas.search import SearchResponse

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=SearchResponse)
def global_search(
    query: str = Query(..., min_length=1, description="Search term"),
    db: Session = Depends(get_db),
) -> dict:
    """Search for query across meeting titles and transcript segments.

    Returns list of matching meetings with context snippets.
    """
    # 1. Search meetings with matching titles
    title_matches = db.query(Meeting).filter(Meeting.title.ilike(f"%{query}%")).all()

    # 2. Search transcript segments with matching text
    segment_matches = (
        db.query(TranscriptSegment)
        .filter(TranscriptSegment.text.ilike(f"%{query}%"))
        .options(joinedload(TranscriptSegment.meeting))
        .all()
    )

    results = []
    seen_meeting_ids = set()

    # Add title matches first
    for meeting in title_matches:
        results.append(
            {
                "meeting_id": meeting.id,
                "title": meeting.title,
                "date": meeting.date,
                "match_type": "title",
                "snippet": None,
            }
        )
        seen_meeting_ids.add(meeting.id)

    # Add transcript matches next, avoiding duplicate meeting records
    for segment in segment_matches:
        if segment.meeting_id not in seen_meeting_ids:
            results.append(
                {
                    "meeting_id": segment.meeting_id,
                    "title": segment.meeting.title,
                    "date": segment.meeting.date,
                    "match_type": "transcript",
                    "snippet": segment.text,
                }
            )
            seen_meeting_ids.add(segment.meeting_id)

    return {
        "results": results,
        "total": len(results),
        "query": query,
    }
