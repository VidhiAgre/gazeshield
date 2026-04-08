from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import base64
import cv2
import numpy as np
import face_recognition

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.face_encoding import FaceEncoding

router = APIRouter(
    prefix="/face",
    tags=["Face Verification"]
)

# stricter matching threshold
FACE_TOLERANCE = 0.45
MIN_FACE_SIZE = 120


@router.post("/verify")
def verify_face(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    image_base64 = payload.get("image")

    if not image_base64:
        raise HTTPException(
            status_code=400,
            detail="Image field is required"
        )

    # ----------------------------
    # Decode Image
    # ----------------------------
    try:
        header, encoded = image_base64.split(",")
        img_bytes = base64.b64decode(encoded)
        np_img = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
    except Exception:
        return {
            "verified": False,
            "message": "Image decode failed"
        }

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # ----------------------------
    # Detect Face Location
    # ----------------------------
    face_locations = face_recognition.face_locations(rgb)

    if len(face_locations) != 1:
        return {
            "verified": False,
            "message": "Exactly one face must be visible"
        }

    # ----------------------------
    # Check Face Size
    # ----------------------------
    top, right, bottom, left = face_locations[0]

    if (bottom - top) < MIN_FACE_SIZE:
        return {
            "verified": False,
            "message": "Move closer to the camera"
        }

    # ----------------------------
    # Generate Face Encoding
    # ----------------------------
    encodings = face_recognition.face_encodings(rgb, face_locations)

    if not encodings:
        return {
            "verified": False,
            "message": "Face encoding failed"
        }

    live_encoding = encodings[0]

    # ----------------------------
    # Fetch Stored Encodings
    # ----------------------------
    stored_faces = db.query(FaceEncoding).filter(
        FaceEncoding.user_id == current_user.id
    ).all()

    if not stored_faces:
        return {
            "verified": False,
            "message": "No registered face found"
        }

    known_encodings = [np.array(face.encoding) for face in stored_faces]

    # ----------------------------
    # Compare Faces
    # ----------------------------
    matches = face_recognition.compare_faces(
        known_encodings,
        live_encoding,
        tolerance=FACE_TOLERANCE
    )

    if True in matches:
        return {
            "verified": True,
            "message": "Face verified successfully"
        }

    return {
        "verified": False,
        "message": "Face does not match registered user"
    }