from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.db.database import Base

class SessionEvent(Base):
    __tablename__ = "session_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("session_modes.id", ondelete="CASCADE"),
        nullable=False
    )

    event_type = Column(String, nullable=False)  
    # examples: face_verified, unknown_face, multiple_faces, gaze_away

    severity = Column(String, default="low")  
    # low, medium, high

    description = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)