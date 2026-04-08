import { useEffect, useState } from "react";
import { api } from "../../api/api";

export default function Evidence() {
  const [evidence, setEvidence] = useState([]);

  // Fetch all evidence on load
  useEffect(() => {
    fetchEvidence();
  }, []);

  const fetchEvidence = async () => {
    try {
      const res = await api.get("/evidence");
      setEvidence(res.data);
    } catch (error) {
      console.error("Error fetching evidence:", error);
    }
  };

  // Delete an evidence by filename
  const deleteEvidence = async (filename) => {
    try {
      await api.delete(`/evidence/${filename}`);
      setEvidence((prev) => prev.filter((e) => e.image !== filename));
    } catch (error) {
      console.error("Error deleting evidence:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "20px" }}>Evidence</h2>

      {evidence.length === 0 && <p>No evidence yet.</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
        }}
      >
        {evidence.map((item) => {
          const filename = item.image;

          return (
            <div
              key={item.id}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                borderRadius: "10px",
                position: "relative",
              }}
            >
              <img
                src={`http://localhost:8000/evidence_images/${filename}`}
                alt="evidence"
                style={{ width: "100%", borderRadius: "8px" }}
              />

              <p><b>Person:</b> {item.detected_person}</p>
              <p><b>Mode:</b> {item.mode}</p>
              <p><b>Time:</b> {new Date(item.created_at).toLocaleString()}</p>

              <button
                onClick={() => deleteEvidence(filename)}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  background: "red",
                  color: "white",
                  border: "none",
                  padding: "6px 10px",
                  cursor: "pointer",
                  borderRadius: "5px",
                }}
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