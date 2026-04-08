from typing import Optional
import threading
from sqlalchemy import UUID

from app.vision.gaze_monitor import GazeMonitor
from app.websockets.vision_ws import vision_ws_manager
from app.services.violation_handler import handle_violation
from app.services.evidence_service import save_evidence_image  # ✅ move here


class VisionManager:

    def __init__(self):
        self._monitor: Optional[GazeMonitor] = None
        self._session_id: Optional[str] = None
        self._lock = threading.Lock()

    def start(self, *, session_id: str, mode: str, owner_user_id: UUID,
              allowed_user_ids: list, allowed_encodings: list):

        with self._lock:
            self.stop()

            self._session_id = session_id

            self._monitor = GazeMonitor(
                allowed_encodings=allowed_encodings,
                allowed_user_ids=allowed_user_ids,
                owner_user_id=owner_user_id,
                mode=mode,
                session_id=session_id,
                violation_callback=self._on_violation,
            )

            print(f"🎥 Vision started | session={session_id} | mode={mode}")

    def process_frame(self, *, session_id: str, frame):
        if not self._monitor:
            return

        if session_id != self._session_id:
            return

        self._monitor.process_frame(frame)

    # ✅ KEEP ONLY ONE VERSION HERE
    def _on_violation(self, frame, user_id, session_id, violation_type):
        evidence = save_evidence_image(frame, user_id, session_id)

        # ❗ FIX: send_alert does not exist yet
        vision_ws_manager.send_to_session(session_id, {
            "type": "violation",
            "user_id": user_id,
            "violation_type": violation_type,
            "evidence_id": str(evidence.id),
            "file_path": evidence.file_path,
            "timestamp": evidence.timestamp.isoformat()
        })

    def stop(self):
        with self._lock:
            if self._monitor:
                print(f"🛑 Vision stopped | session={self._session_id}")

            self._monitor = None
            self._session_id = None


vision_manager = VisionManager()