from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.evidence import Evidence
import os

router = APIRouter(prefix="/evidence", tags=["Evidence"])


@router.get("/")
def get_all_evidence(db: Session = Depends(get_db)):
    evidence = db.query(Evidence).order_by(Evidence.created_at.desc()).all()
    return evidence


@router.delete("/{evidence_id}")
def delete_evidence(evidence_id: str, db: Session = Depends(get_db)):

    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()

    if not evidence:
        return {"error": "Evidence not found"}

    if os.path.exists(evidence.image_path):
        os.remove(evidence.image_path)

    db.delete(evidence)
    db.commit()

    return {"message": "Evidence deleted"}