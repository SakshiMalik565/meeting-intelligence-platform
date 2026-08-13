"""Action items router — handles creation, update, and deletion of action items.

Endpoints:
    - POST /api/v1/meetings/{meeting_id}/action-items
    - PATCH /api/v1/action-items/{id}
    - DELETE /api/v1/action-items/{id}
"""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import ActionItem, Meeting
from app.schemas.action_item import ActionItemCreateRequest, ActionItemUpdateRequest
from app.schemas.meeting import ActionItemResponse

router = APIRouter(tags=["action-items"])


@router.post("/meetings/{meeting_id}/action-items", response_model=ActionItemResponse, status_code=201)
def create_action_item(
    meeting_id: str,
    body: ActionItemCreateRequest,
    db: Session = Depends(get_db),
) -> ActionItem:
    """Create a new action item under a specific meeting."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    action_item = ActionItem(
        id=str(uuid.uuid4()),
        meeting_id=meeting_id,
        text=body.text,
        assignee_name=body.assignee_name,
        is_completed=False,
        created_at=datetime.utcnow(),
    )
    db.add(action_item)
    db.commit()
    db.refresh(action_item)
    return action_item


@router.patch("/action-items/{action_item_id}", response_model=ActionItemResponse)
def update_action_item(
    action_item_id: str,
    body: ActionItemUpdateRequest,
    db: Session = Depends(get_db),
) -> ActionItem:
    """Update text, assignee, or completion status of an action item."""
    action_item = db.query(ActionItem).filter(ActionItem.id == action_item_id).first()
    if not action_item:
        raise HTTPException(status_code=404, detail="Action item not found")

    if body.text is not None:
        action_item.text = body.text
    if body.assignee_name is not None:
        action_item.assignee_name = body.assignee_name
    if body.is_completed is not None:
        action_item.is_completed = body.is_completed

    db.commit()
    db.refresh(action_item)
    return action_item


@router.delete("/action-items/{action_item_id}", status_code=204)
def delete_action_item(action_item_id: str, db: Session = Depends(get_db)) -> Response:
    """Delete an action item by ID."""
    action_item = db.query(ActionItem).filter(ActionItem.id == action_item_id).first()
    if not action_item:
        raise HTTPException(status_code=404, detail="Action item not found")

    db.delete(action_item)
    db.commit()
    return Response(status_code=204)
