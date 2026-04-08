import { useEffect, useState, useRef } from "react";
import * as faceapi from "face-api.js";
import { api } from "../api/api";
import dashboardImg from "../assets/dashboard.png";
import MembersSection from "./dashboard/MembersSection.jsx";
import TeamsSection from "./dashboard/TeamsSection.jsx";
import TeamList from "./dashboard/TeamList.jsx";
import TeamDetails from "./dashboard/TeamDetails.jsx";
import CreateTeam from "./dashboard/CreateTeam.jsx";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard({ userId: propUserId, onLogout }) {

  const userId = propUserId || localStorage.getItem("user_id");

  const [user,setUser] = useState(null);
  const [loading,setLoading] = useState(true);

  const [activeMode,setActiveMode] = useState(null);
  const [selectedTeam,setSelectedTeam] = useState(null);
  const [selectedUsers,setSelectedUsers] = useState([]);
  const [darkMode,setDarkMode] = useState(true);
  const [activeSection,setActiveSection] = useState("overview");
  const [sessionId, setSessionId] = useState(null);

  const [evidenceList,setEvidenceList] = useState([]);
useEffect(() => {

  const loadEvidence = async () => {

    try {

      const res = await api.get("/evidence");
      setEvidenceList(res.data);

    } catch(err) {
      console.error("Failed to load evidence", err);
    }

  };

  loadEvidence();

}, []);
  const [accuracyData,setAccuracyData] = useState([]);

  const addEvidence = (item)=>setEvidenceList(prev=>[item,...prev]);

  /* ================= FACE VERIFICATION ================= */

  const [isVerified,setIsVerified] = useState(false);
  const [verifying,setVerifying] = useState(false);
  const [verifyMessage,setVerifyMessage] = useState("");

  const verifyVideoRef = useRef(null);
  const verifyCanvasRef = useRef(null);
  const verifyStreamRef = useRef(null);

  const startVerifyCamera = async ()=>{
    try{
      const stream = await navigator.mediaDevices.getUserMedia({video:true});
      verifyStreamRef.current = stream;
      verifyVideoRef.current.srcObject = stream;
    }catch{
      setVerifyMessage("Camera access denied");
    }
  };

  const stopVerifyCamera = ()=>{
    if(verifyStreamRef.current){
      verifyStreamRef.current.getTracks().forEach(t=>t.stop());
    }
  };

  const handleVerifyFace = async ()=>{

    setVerifying(true);
    setVerifyMessage("");

    try{

      const video = verifyVideoRef.current;
      const canvas = verifyCanvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video,0,0);

      const image = canvas.toDataURL("image/jpeg");

      const res = await api.post("/face/verify",{
        image,
        user_id:userId
      });

      if(res.data.verified){
        stopVerifyCamera();
        setIsVerified(true);
      }else{
        setVerifyMessage(res.data.message || "Face not recognized");
      }

    }catch{
      setVerifyMessage("Verification failed");
    }

    setVerifying(false);
  };

  /* ================= FETCH USER ================= */

  useEffect(()=>{

    if(!userId) return;

    const fetchUser = async ()=>{
      try{
        const res = await api.get(`/users/users/${userId}`);
        setUser(res.data);
      }catch(err){
        console.error("Failed to load user",err);
      }finally{
        setLoading(false);
      }
    };

    fetchUser();

  },[userId]);

  if(!userId) return <CenterText text="Please login again"/>;
  if(loading) return <CenterText text="Loading dashboard..."/>;
  if(!user) return <CenterText text="User not found"/>;

  /* ================= LOCK SCREEN ================= */

  if(!isVerified){

    return(
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">

        <h2 className="text-2xl font-bold mb-3">
          Face Verification Required
        </h2>

        <p className="mb-4 text-gray-400">
          Welcome {user.name}, please verify your identity
        </p>

        <video
          ref={verifyVideoRef}
          autoPlay
          playsInline
          className="w-96 rounded border mb-4"
        />

        <canvas ref={verifyCanvasRef} style={{display:"none"}}/>

        <div className="flex gap-4">

          <button
            onClick={startVerifyCamera}
            className="px-4 py-2 bg-blue-600 rounded"
          >
            Start Camera
          </button>

          <button
            onClick={handleVerifyFace}
            disabled={verifying}
            className="px-4 py-2 bg-green-600 rounded"
          >
            {verifying ? "Verifying..." : "Verify Face"}
          </button>

        </div>

        {verifyMessage && (
          <p className="mt-4 text-yellow-400">
            {verifyMessage}
          </p>
        )}

      </div>
    );
  }

  /* ================= MAIN DASHBOARD ================= */

  const canStart =
    activeMode &&
    (
      activeMode==="single" ||
      activeMode==="exam" ||
      (activeMode==="team" && selectedTeam) ||
      (activeMode==="member" && selectedUsers.length>0)
    );

  const bgMain = darkMode
    ? "bg-gray-900 text-gray-100"
    : "bg-[#f5f7fb] text-gray-900";

  const sidebarBg = darkMode
    ? "bg-gradient-to-b from-gray-800 to-gray-900"
    : "bg-gradient-to-b from-blue-700 to-blue-900 text-white";

  return(

    <div className={`flex min-h-screen ${bgMain}`}>

      <aside className={`w-64 ${sidebarBg} flex flex-col justify-between`}>

        <div>

          <div className="px-6 py-5 text-xl font-bold">
            🛡️ GazeShield
          </div>

          <nav className="mt-6 space-y-2 px-4 text-sm">

            <SidebarItem label="Overview" active={activeSection==="overview"} onClick={()=>setActiveSection("overview")}/>
            <SidebarItem label="Teams" active={activeSection==="teams"} onClick={()=>setActiveSection("teams")}/>
            <SidebarItem label="Members" active={activeSection==="members"} onClick={()=>setActiveSection("members")}/>
            <SidebarItem label="Logs & Evidence" active={activeSection==="logs"} onClick={()=>setActiveSection("logs")}/>
            <SidebarItem label="Analytics" active={activeSection==="analytics"} onClick={()=>setActiveSection("analytics")}/>

          </nav>

        </div>

        <div className="p-4 border-t border-gray-700">

          <p className="text-sm">{user.name}</p>
          <button
            onClick={onLogout}
            className="mt-3 text-sm text-red-400"
          >
            Logout
          </button>

        </div>

      </aside>

      <main className="flex-1 p-8 space-y-6">

        {activeSection==="overview" && (
          <OverviewSection
            user={user}
            activeMode={activeMode}
            setActiveMode={setActiveMode}
            selectedTeam={selectedTeam}
            selectedUsers={selectedUsers}
            canStart={canStart}
            darkMode={darkMode}
            addEvidence={addEvidence}
            sessionId={sessionId}
            setSessionId={setSessionId}
            setAccuracyData={setAccuracyData}
          />
        )}

        {activeSection==="teams" && (
          <TeamsSection
            selectedTeam={selectedTeam}
            setSelectedTeam={setSelectedTeam}
          />
        )}

        {activeSection==="members" && (
          <MembersSection
            selectedUsers={selectedUsers}
            setSelectedUsers={setSelectedUsers}
          />
        )}

        {activeSection==="logs" && (
          <LogsSection
            evidenceList={evidenceList}
            setEvidenceList={setEvidenceList}
          />
        )}

        {activeSection==="analytics" && (
          <AnalyticsSection accuracyData={accuracyData}/>
        )}

      </main>

    </div>

  );

}


/* ================= OVERVIEWSECTION (Monitoring Only) ================= */
function OverviewSection({
  user,
  activeMode,
  setActiveMode,
  selectedTeam,
  selectedUsers,
  canStart,
  darkMode,
  sessionId,
  setSessionId,
  addEvidence,
  setAccuracyData,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [detectedNames, setDetectedNames] = useState(["Scanning..."]);
  const [isBlurred, setIsBlurred] = useState(false);
  const alertAudio = useRef(new Audio("/alert-beep.mp3")).current;
  const lastEventTime = useRef({});

  useEffect(() => {
    const loadModels = async () => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(
          "https://justadudewhohacks.github.io/face-api.js/models/"
        ),
        faceapi.nets.faceLandmark68Net.loadFromUri(
          "https://justadudewhohacks.github.io/face-api.js/models/"
        ),
        faceapi.nets.faceRecognitionNet.loadFromUri(
          "https://justadudewhohacks.github.io/face-api.js/models/"
        ),
      ]);
    };
    loadModels();
  }, []);

  useEffect(() => {
    const fetchFaceDescriptors = async () => {
      let ids = [];
      if (activeMode === "team" && selectedTeam)
        ids = selectedTeam.members.map((m) => m.id);
      else if (activeMode === "member" && selectedUsers.length)
        ids = selectedUsers.map((u) => u.id);
      else ids = [user.id];

      try {
        const res = await api.get("/faces", { params: { ids: ids.join(",") } });
        const labeledDescriptors = res.data.map(
          (f) =>
            new faceapi.LabeledFaceDescriptors(
              f.name,
              f.descriptors.map((d) => new Float32Array(d))
            )
        );
        setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.6));
      } catch (err) {
        console.error("Failed to fetch face descriptors:", err);
      }
    };
    if (activeMode) fetchFaceDescriptors();
  }, [activeMode, selectedTeam, selectedUsers, user]);

  const handleStartMonitoring = async () => {

  try {

    // 🔥 STEP 1: CREATE SESSION IN BACKEND
    const payload = {
  mode_type: activeMode,
};

// ✅ ADD ONLY WHEN NEEDED
if (activeMode === "team" && selectedTeam) {
  payload.team_id = selectedTeam.id;
}

if (activeMode === "member" && selectedUsers.length > 0) {
  payload.selected_members = selectedUsers.map((u) => ({
    email: u.email,
  }));
}

const res = await api.post("/session/start", payload);

// ✅ STORE SESSION ID
setSessionId(res.data.session_id);

  } catch (err) {
    console.error("Session start failed", err);
    return; // ❗ STOP if session fails
  }

  // 🔽 EXISTING CAMERA CODE (UNCHANGED)
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  streamRef.current = stream;
  videoRef.current.srcObject = stream;

  videoRef.current.onloadedmetadata = () => {
    videoRef.current.play();
    setIsCameraOn(true);

    const canvas = faceapi.createCanvasFromMedia(videoRef.current);
    canvasRef.current = canvas;
    document.body.append(canvas);

    const displaySize = {
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight,
    };
    faceapi.matchDimensions(canvas, displaySize);

    intervalRef.current = setInterval(async () => {
        if (!videoRef.current || !faceMatcher) return;

        const detections = await faceapi
          .detectAllFaces(
  videoRef.current,
  new faceapi.TinyFaceDetectorOptions({
    inputSize: 320,
    scoreThreshold: 0.5
  })
)
          .withFaceLandmarks()
          .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let unknownDetected = false;
        const namesThisFrame = [];

        for (const detection of resizedDetections) {
          const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
          let name = "Unknown";
          let isRegistered = false;

          if (bestMatch.label !== "unknown" && bestMatch.distance <= 0.55) {
            name = bestMatch.label;
            isRegistered = name === user.name;

            const confidence = (1 - bestMatch.distance) * 100;
            setAccuracyData((prev) => [
              ...prev.slice(-20),
              {
                time: new Date().toLocaleTimeString(),
                value: Math.min(Math.max(confidence, 0), 100),
              },
            ]);
          } else {
            name = "Unknown";
            unknownDetected = true;
          }

          const leftEye = detection.landmarks.getLeftEye();
          const rightEye = detection.landmarks.getRightEye();
          const gazeAway = isLookingAway(leftEye, rightEye);
          // 🔥 GAZE AWAY EVENT
if (gazeAway && sessionId) {

  const now = Date.now();

  if (
    !lastEventTime.current["gaze_away"] ||
    now - lastEventTime.current["gaze_away"] > 5000
  ) {
    lastEventTime.current["gaze_away"] = now;

    try {
      await api.post("/events", {
        session_id: sessionId,
        event_type: "gaze_away",
        severity: "medium",
        description: "User looking away"
      });
    } catch (err) {
      console.error(err);
    }
  }
}
          if (!isRegistered && !gazeAway) unknownDetected = true;

          namesThisFrame.push(name);
          new faceapi.draw.DrawBox(detection.detection.box, { label: name }).draw(canvas);
        }

setDetectedNames(namesThisFrame.length ? namesThisFrame : ["Scanning..."]);
// 🔥 MULTIPLE FACE EVENT
if (detections.length > 1 && sessionId) {

  const now = Date.now();

  if (
    !lastEventTime.current["multiple_faces"] ||
    now - lastEventTime.current["multiple_faces"] > 5000
  ) {
    lastEventTime.current["multiple_faces"] = now;

    try {
      await api.post("/events", {
        session_id: sessionId,
        event_type: "multiple_faces",
        severity: "high",
        description: "Multiple faces detected"
      });
    } catch (err) {
      console.error(err);
    }
  }
}

if (unknownDetected && sessionId) {

  setIsBlurred(true);
  alertAudio.currentTime = 0;
  alertAudio.play();

  // 🔥 EVENT LOGGING WITH THROTTLING
  const now = Date.now();

  if (
    !lastEventTime.current["unknown_face"] ||
    now - lastEventTime.current["unknown_face"] > 5000
  ) {
    lastEventTime.current["unknown_face"] = now;

    try {
      await api.post("/events", {
        session_id: sessionId,
        event_type: "unknown_face",
        severity: "high",
        description: "Unknown face detected"
      });
    } catch (err) {
      console.error("Event failed", err);
    }
  }

  // ✅ YOUR EXISTING CODE (UNCHANGED)
  const captureCanvas = document.createElement("canvas");
  captureCanvas.width = videoRef.current.videoWidth;
  captureCanvas.height = videoRef.current.videoHeight;

  const captureCtx = captureCanvas.getContext("2d");
  captureCtx.drawImage(videoRef.current, 0, 0);

  const imageData = captureCanvas.toDataURL("image/png");

  // (keep whatever comes after this — API call, addEvidence, etc.)


try {
  const res = await api.post("/evidence/save", {
    image: imageData,
    detected_person: "Unknown",
    user_id: user.id,
    mode: activeMode
  });

  // Backend should return the saved filename, e.g. "abc123.png"
  addEvidence({
    timestamp: res.data.timestamp,   // return from backend
    image: res.data.filename         // return from backend
  });
} catch (error) {
  console.error("Evidence save failed", error);
}


} else {

  setIsBlurred(false);

}
      }, 300);
    };
  };

  const handleStopMonitoring = async () => {
    // 🔥 END SESSION
if (sessionId) {
  try {
    await api.post("/session/stop");
  } catch (err) {
    console.error("Session end failed", err);
  }
}
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (canvasRef.current) {
      canvasRef.current.remove();
      canvasRef.current = null;
    }
    setIsCameraOn(false);
    setIsBlurred(false);
    setDetectedNames(["Scanning..."]);
    setAccuracyData([]); // reset analytics
  };

  const isLookingAway = (leftEye, rightEye) => {
    const avgX = (leftEye[0].x + leftEye[3].x + rightEye[0].x + rightEye[3].x) / 4;
    const centerX = videoRef.current.videoWidth / 2;
    return Math.abs(avgX - centerX) > videoRef.current.videoWidth * 0.15;
  };

  return (
    <div className="relative">
      <h1 className="text-2xl font-bold">Welcome, {user.name} 👋</h1>

      {isBlurred && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <p className="text-red-500 text-xl font-bold text-center px-4">
            ⚠️ Unauthorized user detected! Screen is blurred until they leave.
          </p>
        </div>
      )}

      <section className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Detected User(s):</h2>
        {detectedNames.map((name, idx) => (
          <p
            key={idx}
            className={`font-medium ${
              name === "Unknown" ? "text-red-500" : "text-green-400"
            }`}
          >
            {name}
          </p>
        ))}

        <h2 className="text-lg font-semibold mt-6 mb-2">
          Select Monitoring Mode
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ModeCard
            title="single"
            label="Single"
            desc="Only you are allowed"
            {...{ activeMode, setActiveMode, darkMode }}
          />
          <ModeCard
            title="team"
            label="Team"
            desc="Selected team members allowed"
            {...{ activeMode, setActiveMode, darkMode }}
          />
          <ModeCard
            title="member"
            label="Members"
            desc="Selected registered users allowed"
            {...{ activeMode, setActiveMode, darkMode }}
          />
          <ModeCard
            title="exam"
            label="Exam"
            desc="Strict monitoring mode"
            {...{ activeMode, setActiveMode, darkMode }}
          />
        </div>
      </section>

      <section
        className={`mt-8 p-6 rounded-lg ${
          darkMode ? "bg-gray-800" : "bg-white shadow"
        }`}
      >
        <div className="flex flex-col md:flex-row items-center gap-8">
          <img src={dashboardImg} alt="preview" className="w-[360px] rounded" />
          <div className="flex flex-col justify-center">
            <h3 className="text-xl font-semibold mb-3">Monitoring Control</h3>
            <div className="flex gap-4">
              <button
                disabled={!canStart || isCameraOn}
                onClick={handleStartMonitoring}
                className={`px-6 py-2 rounded text-white ${
                  canStart && !isCameraOn
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-500 cursor-not-allowed"
                }`}
              >
                Start Monitoring
              </button>
              <button
                disabled={!isCameraOn}
                onClick={handleStopMonitoring}
                className={`px-6 py-2 rounded text-white ${
                  isCameraOn
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-500 cursor-not-allowed"
                }`}
              >
                Stop Monitoring
              </button>
            </div>
            <p className="mt-3 text-sm">
              {isCameraOn ? (
                <span className="text-green-400">
                  🟢 Camera ON – capturing faces & gaze
                </span>
              ) : (
                <span className="text-gray-400">⚫ Camera OFF</span>
              )}
            </p>
          </div>
        </div>
      </section>

      <video
        ref={videoRef}
        autoPlay
        muted
        className="fixed bottom-4 right-4 w-72 h-56 rounded-lg border border-gray-400 shadow bg-black"
      />
    </div>
  );
}

/* ================= ANALYTICS SECTION (Confidence Graph) ================= */
function AnalyticsSection() {

  const [summary, setSummary] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/analytics/overview");
        setSummary(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Security Analytics</h2>

      <div className="grid grid-cols-3 gap-6">

        <Card title="Total Sessions" value={summary.total_sessions || 0} />
        <Card title="Total Events" value={summary.total_events || 0} />
        <Card title="High Alerts" value={summary.high_alerts || 0} />

      </div>

    </div>
  );
}

/* ================= LOGS ================= */
function Card({ title, value }) {
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow">
      <p className="text-gray-400 text-sm">{title}</p>
      <h3 className="text-3xl font-bold mt-2">{value}</h3>
    </div>
  );
}

function LogsSection({ evidenceList, setEvidenceList }) {
  const handleDelete = (i) => {
    setEvidenceList((prev) => prev.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Logs & Evidence</h2>
      {evidenceList.length === 0 && <p>No evidence yet.</p>}
      <div className="grid grid-cols-3 gap-4">
        {evidenceList.map((item, i) => {
          const src = item.image || item.image_path || "";
          return (
            <div key={i} className="border rounded p-2 relative">
              <p className="text-xs">{item.timestamp || item.created_at}</p>
              {src && (
               <img
              src={`http://localhost:8000/evidence_images/${src}`}
               alt="evidence"
              className="w-full h-auto"
              />
              )}
              <button
                onClick={() => handleDelete(i)}
                className="absolute top-1 right-1 text-red-500"
              >
                Delete
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================= HELPERS ================= */
function ModeCard({ title, label, desc, activeMode, setActiveMode, darkMode }) {
  const isActive = activeMode === title;
  return (
    <div
      onClick={() => setActiveMode(title)}
      className={`p-4 rounded-lg cursor-pointer border transition ${
        isActive
          ? "bg-blue-600 text-white"
          : darkMode
          ? "bg-gray-700 hover:bg-gray-600"
          : "bg-white hover:bg-gray-100"
      }`}
    >
      <h3 className="font-semibold mb-1">{label}</h3>
      <p className="text-xs">{desc}</p>
    </div>
  );
}

function SidebarItem({ label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`px-4 py-2 rounded cursor-pointer transition ${
        active ? "bg-blue-600 text-white" : "hover:bg-gray-700 hover:text-white"
      }`}
    >
      {label}
    </div>
  );
}

function Placeholder({ title }) {
  return (
    <div>
      <h2 className="text-2xl font-bold capitalize">{title}</h2>
      <p className="text-sm text-gray-400">Section under development.</p>
    </div>
  );
}

function CenterText({ text }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      {text}
    </div>
  );
}