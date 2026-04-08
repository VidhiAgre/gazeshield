from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base


class SessionAnalytics(Base):
    __tablename__ = "session_analytics"

    id = Column(Integer, primary_key=True, index=True)

    session_id = Column(String, index=True)
    user_id = Column(String, index=True)

    total_events = Column(Integer, default=0)
    high_events = Column(Integer, default=0)
    unknown_faces = Column(Integer, default=0)
    multiple_faces = Column(Integer, default=0)

    risk_score = Column(Integer, default=0)

    duration_seconds = Column(Integer, default=0)

    started_at = Column(DateTime)
    ended_at = Column(DateTime)

    created_at = Column(DateTime(timezone=True), server_default=func.now())