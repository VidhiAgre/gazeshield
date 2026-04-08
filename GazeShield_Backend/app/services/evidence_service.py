# app/services/evidence_service.py
import cv2
import os
import uuid
from datetime import datetime

from app.db.database import SessionLocal
from app.models.evidence import Evidence

SAVE_DIR = "evidence"


def save_evidence_image(frame, user_id, session_id, detected_person="Unknown", mode="single"):
    if not os.path.exists(SAVE_DIR):
        os.makedirs(SAVE_DIR)

    filename = f"{uuid.uuid4()}.jpg"
    filepath = os.path.join(SAVE_DIR, filename)

    cv2.imwrite(filepath, frame)

    db = SessionLocal()
    try:
        evidence = Evidence(
            user_id=user_id,
            session_id=session_id,
            image_path=filepath,
            detected_person=detected_person,
            mode=mode,
            created_at=datetime.utcnow()
        )

        db.add(evidence)
        db.commit()
        db.refresh(evidence)  # get auto-generated ID & timestamp
        return evidence  # return full Evidence object

    finally:
        db.close()


def get_user_evidence(user_id: int):
    db = SessionLocal()
    try:
        evidence_list = (
            db.query(Evidence)
            .filter(Evidence.user_id == str(user_id))
            .order_by(Evidence.created_at.desc())
            .all()
        )
        # return as list of dicts
        return [
            {
                "id": str(e.id),
                "user_id": e.user_id,
                "image_path": e.image_path,
                "mode": e.mode,
                "detected_person": e.detected_person,
                "created_at": e.created_at
            }
            for e in evidence_list
        ]
    finally:
        db.close()