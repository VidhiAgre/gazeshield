# app/routes/evidence_routes.py

from fastapi import APIRouter, HTTPException
import base64
import numpy as np
import cv2
import os
import uuid
from datetime import datetime

router = APIRouter()

SAVE_DIR = "evidence"
os.makedirs(SAVE_DIR, exist_ok=True)

# ---------------- POST /evidence/save ----------------
@router.post("/evidence/save")
async def save_evidence(data: dict):
    image_data = data.get("image")
    user_id = data.get("user_id")
    mode = data.get("mode", "single")
    detected_person = data.get("detected_person", "Unknown")

    if not image_data or not user_id:
        raise HTTPException(status_code=400, detail="Missing image or user_id")

    try:
        # Remove base64 header if present
        if "," in image_data:
            _, encoded = image_data.split(",", 1)
        else:
            encoded = image_data

        img_bytes = base64.b64decode(encoded)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        # Save image
        filename = f"{uuid.uuid4()}.png"
        filepath = os.path.join(SAVE_DIR, filename)
        cv2.imwrite(filepath, frame)

        # Return info
        return {
            "status": "saved",
            "filename": filename,
            "timestamp": datetime.now().isoformat(),
            "detected_person": detected_person,
            "mode": mode
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save image: {e}")

# ---------------- GET /evidence ----------------
@router.get("/evidence")
async def get_evidence():
    try:
        files = os.listdir(SAVE_DIR)
        evidence_list = []
        for f in files:
            filepath = os.path.join(SAVE_DIR, f)
            timestamp = datetime.fromtimestamp(os.path.getmtime(filepath)).isoformat()
            evidence_list.append({
                "id": f.split(".")[0],
                "image": f,
                "created_at": timestamp,
                "detected_person": "Unknown",
                "mode": "single"
            })
        # Sort newest first
        evidence_list.sort(key=lambda x: x["created_at"], reverse=True)
        return evidence_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list evidence: {e}")

# ---------------- DELETE /evidence/{filename} ----------------
@router.delete("/evidence/{filename}")
async def delete_evidence(filename: str):
    filepath = os.path.join(SAVE_DIR, filename)
    if os.path.exists(filepath):
        os.remove(filepath)
        return {"status": "deleted", "filename": filename}
    else:
        raise HTTPException(status_code=404, detail="File not found")