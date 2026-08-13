"""Meetings router — handles CRUD, filtering, transcript searches, and summaries.

Endpoints:
    - GET /api/v1/meetings
    - POST /api/v1/meetings (multipart form upload)
    - GET /api/v1/meetings/{id}
    - PATCH /api/v1/meetings/{id}
    - DELETE /api/v1/meetings/{id}
    - GET /api/v1/meetings/{id}/transcript
    - POST /api/v1/meetings/{id}/regenerate-summary
"""

import math
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Response, UploadFile
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models import ActionItem, KeyTopic, Meeting, Participant, Summary, TranscriptSegment, User
from app.schemas.meeting import (
    MeetingDetailResponse,
    MeetingUpdateRequest,
    PaginatedMeetingsResponse,
)
from app.schemas.transcript import TranscriptSearchResponse
from app.services.summary_service import generate_summary
from app.services.transcript_parser import parse_transcript

router = APIRouter(prefix="/meetings", tags=["meetings"])


@router.get("", response_model=PaginatedMeetingsResponse)
def list_meetings(
    search: str | None = Query(None, description="Case-insensitive match on meeting title"),
    participant: str | None = Query(None, description="Filter by participant name"),
    date_from: datetime | None = Query(None, description="Inclusive start date filter"),
    date_to: datetime | None = Query(None, description="Inclusive end date filter"),
    sort: str = Query("recent", description="Sort by 'recent' or 'oldest'"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> dict:
    """List all meetings with advanced filtering and pagination."""
    query = db.query(Meeting)

    # 1. Title search filter
    if search:
        query = query.filter(Meeting.title.ilike(f"%{search}%"))

    # 2. Participant name filter
    if participant:
        query = query.filter(Meeting.participants.any(Participant.name.ilike(f"%{participant}%")))

    # 3. Date range filters
    if date_from:
        query = query.filter(Meeting.date >= date_from)
    if date_to:
        query = query.filter(Meeting.date <= date_to)

    # 4. Sorting
    if sort == "oldest":
        query = query.order_by(Meeting.date.asc())
    else:
        query = query.order_by(Meeting.date.desc())

    # 5. Pagination count
    total = query.count()
    total_pages = max(1, math.ceil(total / per_page))

    # 6. Fetch paginated records with eager loaded participants
    meetings = (
        query.options(joinedload(Meeting.participants))
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


@router.post("", response_model=MeetingDetailResponse, status_code=201)
def create_meeting(
    title: str = Form(..., min_length=1, description="Meeting title"),
    date: str = Form(..., description="ISO datetime string for the meeting date"),
    duration_seconds: int = Form(..., gt=0, description="Meeting duration in seconds"),
    participant_names: str | None = Form(None, description="Comma-separated participant names"),
    transcript_file: UploadFile | None = File(None, description="Transcript file (.txt, .vtt, .json)"),
    transcript_text: str | None = Form(None, description="Raw pasted transcript text"),
    db: Session = Depends(get_db),
) -> Meeting:
    """Create a new meeting from form fields and parsed transcript.

    On creation, triggers transcript segment parsing and summary generation.
    """
    # 1. Input validations
    if not transcript_file and not transcript_text:
        raise HTTPException(
            status_code=400,
            detail="Either transcript_file or transcript_text must be provided",
        )

    # Validate date string
    try:
        meeting_date = datetime.fromisoformat(date.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail="Invalid date format. Use ISO format (e.g. YYYY-MM-DDTHH:MM:SS)",
        )

    # 2. Parse transcript content
    filename = transcript_file.filename if transcript_file else None
    content = ""
    if transcript_file:
        try:
            content_bytes = transcript_file.file.read()
            content = content_bytes.decode("utf-8", errors="ignore")
        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to read uploaded transcript file: {exc}",
            )
    else:
        content = transcript_text or ""

    try:
        parsed_segments = parse_transcript(content, filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # 3. Retrieve or create participants
    participants = []
    if participant_names:
        names = [n.strip() for n in participant_names.split(",") if n.strip()]
        for name in names:
            p = db.query(Participant).filter(Participant.name == name).first()
            if not p:
                p = Participant(id=str(uuid.uuid4()), name=name, email=None)
                db.add(p)
            participants.append(p)

    # 4. Fetch host user
    host = db.query(User).first()
    if not host:
        raise HTTPException(
            status_code=404,
            detail="No host user found. Run the seed script first.",
        )

    # 5. Create Meeting entity
    meeting = Meeting(
        id=str(uuid.uuid4()),
        title=title,
        date=meeting_date,
        duration_seconds=duration_seconds,
        host_user_id=host.id,
        media_url="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    )
    meeting.participants = participants
    db.add(meeting)
    db.flush()  # Generate meeting.id for foreign keys

    # 6. Save TranscriptSegments
    db_segments = []
    for seg in parsed_segments:
        db_seg = TranscriptSegment(
            id=str(uuid.uuid4()),
            meeting_id=meeting.id,
            speaker_name=seg["speaker_name"],
            start_time_seconds=seg["start_time_seconds"],
            end_time_seconds=seg["end_time_seconds"],
            text=seg["text"],
            order_index=seg["order_index"],
        )
        db_segments.append(db_seg)
    db.add_all(db_segments)

    # 7. Generate and save Summary, KeyTopics, and ActionItems
    transcript_text_full = "\n".join(
        [f"{seg['speaker_name']}: {seg['text']}" for seg in parsed_segments]
    )
    summary_result = generate_summary(transcript_text_full)

    db_summary = Summary(
        id=str(uuid.uuid4()),
        meeting_id=meeting.id,
        overview_text=summary_result.overview,
        generated_at=datetime.utcnow(),
    )
    db.add(db_summary)

    for idx, topic in enumerate(summary_result.key_topics):
        db_topic = KeyTopic(
            id=str(uuid.uuid4()),
            meeting_id=meeting.id,
            topic_text=topic,
            order_index=idx,
        )
        db.add(db_topic)

    for ai in summary_result.action_items:
        db_ai = ActionItem(
            id=str(uuid.uuid4()),
            meeting_id=meeting.id,
            text=ai["text"],
            assignee_name=ai.get("assignee_name"),
            is_completed=False,
            created_at=datetime.utcnow(),
        )
        db.add(db_ai)

    db.commit()

    # 8. Re-query with all relations eager loaded
    result = (
        db.query(Meeting)
        .options(
            joinedload(Meeting.participants),
            joinedload(Meeting.transcript_segments),
            joinedload(Meeting.summary),
            joinedload(Meeting.key_topics),
            joinedload(Meeting.action_items),
        )
        .filter(Meeting.id == meeting.id)
        .first()
    )
    return result


@router.get("/{meeting_id}", response_model=MeetingDetailResponse)
def get_meeting(meeting_id: str, db: Session = Depends(get_db)) -> Meeting:
    """Return full detail of a meeting by ID."""
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


@router.patch("/{meeting_id}", response_model=MeetingDetailResponse)
def update_meeting(
    meeting_id: str,
    body: MeetingUpdateRequest,
    db: Session = Depends(get_db),
) -> Meeting:
    """Edit metadata (title, participants) of a meeting."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if body.title is not None:
        meeting.title = body.title

    if body.participant_names is not None:
        new_participants = []
        for name in body.participant_names:
            p = db.query(Participant).filter(Participant.name == name).first()
            if not p:
                p = Participant(id=str(uuid.uuid4()), name=name, email=None)
                db.add(p)
            new_participants.append(p)
        meeting.participants = new_participants

    db.commit()

    return get_meeting(meeting_id, db)


@router.delete("/{meeting_id}", status_code=204)
def delete_meeting(meeting_id: str, db: Session = Depends(get_db)) -> Response:
    """Delete a meeting and cascade remove all related entities."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    db.delete(meeting)
    db.commit()
    return Response(status_code=204)


@router.get("/{meeting_id}/transcript", response_model=TranscriptSearchResponse)
def get_meeting_transcript(
    meeting_id: str,
    query: str | None = Query(None, description="Highlight search term in text"),
    db: Session = Depends(get_db),
) -> dict:
    """Return meeting's transcript segments with match highlighted offsets."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    segments = (
        db.query(TranscriptSegment)
        .filter(TranscriptSegment.meeting_id == meeting_id)
        .order_by(TranscriptSegment.order_index)
        .all()
    )

    match_count = 0
    results = []

    for seg in segments:
        matches = []
        if query:
            seg_text_lower = seg.text.lower()
            query_lower = query.lower()
            query_len = len(query)

            start = 0
            while True:
                idx = seg_text_lower.find(query_lower, start)
                if idx == -1:
                    break
                matches.append({"start_char": idx, "end_char": idx + query_len})
                match_count += 1
                start = idx + query_len

        results.append(
            {
                "id": seg.id,
                "speaker_name": seg.speaker_name,
                "start_time_seconds": seg.start_time_seconds,
                "end_time_seconds": seg.end_time_seconds,
                "text": seg.text,
                "order_index": seg.order_index,
                "matches": matches,
            }
        )

    return {"segments": results, "match_count": match_count}


@router.post("/{meeting_id}/regenerate-summary", response_model=MeetingDetailResponse)
def regenerate_summary_endpoint(
    meeting_id: str,
    db: Session = Depends(get_db),
) -> Meeting:
    """Re-run summary generator on existing transcript and update details."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    segments = (
        db.query(TranscriptSegment)
        .filter(TranscriptSegment.meeting_id == meeting_id)
        .order_by(TranscriptSegment.order_index)
        .all()
    )

    if not segments:
        raise HTTPException(
            status_code=400,
            detail="Cannot regenerate summary for a meeting with no transcript segments",
        )

    transcript_text_full = "\n".join([f"{seg.speaker_name}: {seg.text}" for seg in segments])
    summary_result = generate_summary(transcript_text_full)

    # 1. Replace Summary
    summary = db.query(Summary).filter(Summary.meeting_id == meeting_id).first()
    if summary:
        summary.overview_text = summary_result.overview
        summary.generated_at = datetime.utcnow()
    else:
        new_summary = Summary(
            id=str(uuid.uuid4()),
            meeting_id=meeting.id,
            overview_text=summary_result.overview,
            generated_at=datetime.utcnow(),
        )
        db.add(new_summary)

    # 2. Replace KeyTopics
    db.query(KeyTopic).filter(KeyTopic.meeting_id == meeting_id).delete()
    for idx, topic in enumerate(summary_result.key_topics):
        db_topic = KeyTopic(
            id=str(uuid.uuid4()),
            meeting_id=meeting.id,
            topic_text=topic,
            order_index=idx,
        )
        db.add(db_topic)

    db.commit()

    return get_meeting(meeting_id, db)
