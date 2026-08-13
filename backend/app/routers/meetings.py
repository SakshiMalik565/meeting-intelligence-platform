"""Meetings router — stub endpoints for Phase 1 verification.

Provides GET /meetings (list) and GET /meetings/{id} (detail).
Full CRUD and filtering will be added in Phase 2.
"""

import math

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models.meeting import Meeting
from app.schemas.meeting import (
    MeetingDetailResponse,
    MeetingListResponse,
    PaginatedMeetingsResponse,
)

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.get("", response_model=PaginatedMeetingsResponse)
def list_meetings(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> dict:
    """List all meetings with pagination.

    Full search/filter support (search, participant, date_from, date_to, sort)
    will be added in Phase 2. For now, returns all meetings sorted by date desc.
    """
    # Count total meetings for pagination metadata
    total = db.query(Meeting).count()
    total_pages = max(1, math.ceil(total / per_page))

    # Eager-load participants to avoid N+1 queries in serialization
    meetings = (
        db.query(Meeting)
        .options(joinedload(Meeting.participants))
        .order_by(Meeting.date.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return {
        "items": meetings,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
    }


@router.get("/{meeting_id}", response_model=MeetingDetailResponse)
def get_meeting(meeting_id: str, db: Session = Depends(get_db)) -> Meeting:
    """Return full meeting detail including transcript, summary, and action items.

    Uses joinedload on all relationships to fetch everything in a single query
    rather than issuing N+1 lazy-load queries.
    """
    meeting = (
        db.query(Meeting)
        .options(
            joinedload(Meeting.participants),
            joinedload(Meeting.transcript_segments),
            joinedload(Meeting.summary),
            joinedload(Meeting.key_topics),
            joinedload(Meeting.action_items),
        )
        .filter(Meeting.id == meeting_id)
        .first()
    )

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    return meeting
