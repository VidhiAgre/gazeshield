from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.session_analytics import SessionAnalytics
from sqlalchemy import func

router = APIRouter(prefix="/analytics", tags=["Analytics"])


# 🔥 OVERVIEW
@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    total_sessions = db.query(SessionAnalytics).count()
    total_events = db.query(func.sum(SessionAnalytics.total_events)).scalar() or 0
    avg_risk = db.query(func.avg(SessionAnalytics.risk_score)).scalar() or 0
    high_risk = db.query(SessionAnalytics).filter(SessionAnalytics.risk_score > 70).count()

    return {
        "total_sessions": total_sessions,
        "total_events": total_events,
        "avg_risk_score": round(avg_risk, 2),
        "high_risk_sessions": high_risk
    }


# 📈 EVENTS OVER TIME
@router.get("/events-over-time")
def events_over_time(db: Session = Depends(get_db)):
    results = db.execute("""
        SELECT DATE(created_at) as date, SUM(total_events) as count
        FROM session_analytics
        GROUP BY date
        ORDER BY date
    """)

    return [{"date": str(r[0]), "count": r[1]} for r in results]


# 📊 RISK DISTRIBUTION
@router.get("/risk-distribution")
def risk_distribution(db: Session = Depends(get_db)):
    sessions = db.query(SessionAnalytics).all()

    return {
        "low": len([s for s in sessions if s.risk_score < 30]),
        "medium": len([s for s in sessions if 30 <= s.risk_score < 70]),
        "high": len([s for s in sessions if s.risk_score >= 70]),
    }


# 📋 ALL SESSIONS
@router.get("/sessions")
def all_sessions(db: Session = Depends(get_db)):
    sessions = db.query(SessionAnalytics).order_by(SessionAnalytics.created_at.desc()).all()

    return [
        {
            "session_id": s.session_id,
            "risk_score": s.risk_score,
            "events": s.total_events,
            "duration": s.duration_seconds,
            "created_at": s.created_at
        }
        for s in sessions
    ]