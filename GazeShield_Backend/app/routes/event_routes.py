from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel

from app.db.database import get_db
from app.models.session_event import SessionEvent
from app.models.session_mode import SessionMode
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/events", tags=["Events"])


# ✅ REQUEST BODY MODEL (IMPORTANT)
class EventCreate(BaseModel):
    session_id: str
    event_type: str
    severity: str = "low"
    description: str = ""


@router.post("/")
def create_event(
    data: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(SessionMode).filter(SessionMode.id == data.session_id).first()

    if not session:
        raise HTTPException(status_code=404, detail="Invalid session")

    event = SessionEvent(
        session_id=session.id,
        event_type=data.event_type,
        severity=data.severity,
        description=data.description,
        created_at=datetime.utcnow(),
    )

    db.add(event)
    db.commit()

    return {"message": "Event logged"}