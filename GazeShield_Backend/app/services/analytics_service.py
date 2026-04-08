from app.models.session_event import SessionEvent


class AnalyticsService:

    @staticmethod
    def compute_session_analytics(db, session_id: str):
        events = db.query(SessionEvent).filter(SessionEvent.session_id == session_id).all()

        total_events = len(events)
        high_events = len([e for e in events if e.severity == "high"])
        unknown_faces = len([e for e in events if e.event_type == "unknown_face"])
        multiple_faces = len([e for e in events if e.event_type == "multiple_faces"])

        # 🔥 Risk Score Logic
        risk_score = (
            high_events * 10 +
            unknown_faces * 15 +
            multiple_faces * 20
        )

        return {
            "total_events": total_events,
            "high_events": high_events,
            "unknown_faces": unknown_faces,
            "multiple_faces": multiple_faces,
            "risk_score": risk_score
        }