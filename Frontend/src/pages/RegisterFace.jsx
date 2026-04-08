import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { api } from "../api/api";

export default function RegisterFace({ goHome, onRegistered }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const autoRef = useRef(false); // track auto mode safely

  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bbox, setBbox] = useState(null);
  const [feedbackColor, setFeedbackColor] = useState("red");
  const [autoCapture, setAutoCapture] = useState(false);

  const userId = localStorage.getItem("user_id");

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-red-400">
        Error: userId missing. Please login again.
      </div>
    );
  }

  // Capture frame and send to backend
  const captureFrame = async () => {
    if (!webcamRef.current || loading || count >= 50) return;

    setLoading(true);
    setError("");

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        setError("Failed to capture image");
        return;
      }

      const res = await api.post("/vision/register-face-frame", {
        image: imageSrc,
      });

      const data = res.data;

      setBbox(data.bbox || null);
      setFeedbackColor(data.accepted ? "lime" : "red");

      if (data.accepted) {
        setCount((prev) => {
          const newCount = prev + 1;
          return newCount > 50 ? 50 : newCount; // ensure max 50
        });
      } else {
        setError(data.reason || "Face not accepted");
      }
    } catch (err) {
      console.error(err);
      setError("Server error while capturing face.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-capture effect
  useEffect(() => {
    autoRef.current = autoCapture;
    let interval;

    if (autoCapture && count < 50) {
      interval = setInterval(async () => {
        if (!loading && count < 50) {
          await captureFrame();
        }
      }, 200); // adjust speed as needed
    }

    if (count >= 50) {
      clearInterval(interval);
      autoRef.current = false;
      setAutoCapture(false);
    }

    return () => clearInterval(interval);
  }, [autoCapture, count, loading]);

  // Draw bounding box
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    const video = webcamRef.current?.video;
    if (!ctx || !video) return;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (bbox) {
      ctx.strokeStyle = feedbackColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(
        bbox.x * ctx.canvas.width,
        bbox.y * ctx.canvas.height,
        bbox.width * ctx.canvas.width,
        bbox.height * ctx.canvas.height
      );
    }
  }, [bbox, feedbackColor]);

  // Redirect safely when count reaches 50
  useEffect(() => {
    if (count === 50) {
      setAutoCapture(false); // stop auto mode
      setTimeout(() => {
        alert("Face registration completed successfully!");
        if (onRegistered) onRegistered();
      }, 300);
    }
  }, [count, onRegistered]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#050b17] via-[#0b1c2f] to-black flex items-center justify-center px-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-[#0a1930]/90 shadow-[0_0_40px_rgba(79,245,255,0.15)] p-6">

        {/* Header */}
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">📸</div>
          <h1 className="text-2xl font-bold tracking-wider text-cyan-300">
            Face Registration
          </h1>
          <p className="text-xs tracking-widest text-cyan-200/70 mt-1">
            CAPTURE CLEAR FACE FRAMES
          </p>
        </div>

        {/* Webcam + Canvas */}
        <div className="relative rounded-xl overflow-hidden border border-cyan-400/30 mb-4">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="w-full"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={() => setAutoCapture(false)}
            className={`py-2 px-4 rounded-xl font-bold ${
              !autoCapture
                ? "bg-cyan-400 text-black shadow-lg"
                : "bg-cyan-900 text-cyan-300"
            }`}
          >
            Manual
          </button>
          <button
            onClick={() => setAutoCapture(true)}
            className={`py-2 px-4 rounded-xl font-bold ${
              autoCapture
                ? "bg-lime-400 text-black shadow-lg"
                : "bg-cyan-900 text-cyan-300"
            }`}
          >
            Auto
          </button>
        </div>

        {/* Status */}
        <p className="text-center text-cyan-200 mb-2">
          Captured: <span className="font-bold">{count}</span> / 50
        </p>

        {error && (
          <p className="text-center text-red-400 text-sm mb-2">
            {error}
          </p>
        )}

        {/* Manual Capture Button */}
        {!autoCapture && (
          <button
            onClick={captureFrame}
            disabled={loading || count >= 50}
            className="w-full py-3 rounded-xl font-bold tracking-widest bg-gradient-to-r from-cyan-400 to-purple-500 text-black shadow-[0_0_25px_rgba(79,245,255,0.4)] hover:scale-[1.02] transition disabled:opacity-60"
          >
            {loading
              ? "CAPTURING..."
              : count >= 50
              ? "DONE"
              : "CAPTURE FRAME"}
          </button>
        )}

        {/* Back Button */}
        <div className="mt-4 text-center">
          <button
            onClick={goHome}
            className="text-cyan-300 text-sm tracking-widest hover:text-cyan-400 transition"
          >
            ← BACK TO HOME
          </button>
        </div>
      </div>
    </div>
  );
}