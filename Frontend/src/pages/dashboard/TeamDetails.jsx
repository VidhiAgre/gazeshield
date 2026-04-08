import { useEffect, useState } from "react";
import { api } from "../../api/api";

export default function TeamDetails({ team, refreshTeams }) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const isOwner = team.role === "owner";
  const isFull = members.length >= 10; // ✅ ADDED

  /* ---------------- FETCH MEMBERS ---------------- */
  const fetchMembers = async () => {
    try {
      const res = await api.get(
        `/teams/teams/${team.team_id}/members`
      );
      setMembers(res.data);
    } catch (err) {
      console.error("Failed to load members");
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [team.team_id]);

  /* ---------------- INVITE (OWNER ONLY) ---------------- */
  const inviteMember = async () => {
    if (isFull) return; // ✅ EXTRA SAFETY GUARD

    if (!inviteEmail) {
      alert("Please enter an email");
      return;
    }

    try {
      await api.post(`/teams/teams/${team.team_id}/invite`, {
        email: inviteEmail,
      });
      setInviteEmail("");
      fetchMembers();
    } catch (err) {
      alert(err?.response?.data?.detail || "Invite failed");
    }
  };

  /* ---------------- REMOVE MEMBER (OWNER ONLY) ---------------- */
  const removeMember = async (userId) => {
    if (!confirm("Remove this member?")) return;

    try {
      await api.delete(
        `/teams/teams/${team.team_id}/remove/${userId}`
      );
      fetchMembers();
    } catch {
      alert("Failed to remove member");
    }
  };

  /* ---------------- LEAVE TEAM (MEMBER ONLY) ---------------- */
  const leaveTeam = async () => {
    if (!confirm("Leave this team?")) return;

    try {
      await api.delete(`/teams/teams/${team.team_id}/leave`);
      refreshTeams();
    } catch {
      alert("Failed to leave team");
    }
  };

  /* ---------------- DELETE TEAM (OWNER ONLY) ---------------- */
  const deleteTeam = async () => {
    if (!confirm("Delete this team permanently?")) return;

    try {
      await api.delete(`/teams/teams/${team.team_id}`);
      refreshTeams();
    } catch {
      alert("Failed to delete team");
    }
  };

  return (
    <div className="flex-1 bg-gray-800 rounded-lg p-6 overflow-y-auto">
      {/* Header */}
      <h2 className="text-2xl font-bold mb-1">{team.team_name}</h2>
      <p className="text-sm text-gray-400 mb-6">
        Role: {team.role}
      </p>

      {/* ================= INVITE (OWNER ONLY) ================= */}
      {isOwner && (
        <div className="mb-8">
          <h4 className="font-semibold mb-2">Invite Member</h4>

          {/* ✅ LIMIT MESSAGE */}
          {isFull && (
            <p className="text-xs text-red-400 mb-2">
              Maximum 10 members allowed per team.
            </p>
          )}

          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="member@example.com"
              className="flex-1 p-2 rounded bg-gray-700 text-sm"
            />
            <button
              onClick={inviteMember}
              disabled={isFull}
              className={`px-4 py-2 rounded ${
                isFull
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isFull ? "Team Full (10 Max)" : "Invite"}
            </button>
          </div>
        </div>
      )}

      {/* ================= MEMBERS LIST ================= */}
      <div className="mb-8">
        <h4 className="font-semibold mb-3">
          Team Members ({members.length}/10) {/* ✅ Optional Count */}
        </h4>

        {loadingMembers ? (
          <p className="text-gray-400 text-sm">Loading members...</p>
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.user_id}
                className="flex items-center justify-between bg-gray-700 p-3 rounded"
              >
                <div>
                  <p className="text-sm font-medium">
                    {member.email || member.user_id}
                  </p>
                  <p className="text-xs text-gray-400">
                    {member.role}
                  </p>
                </div>

                {isOwner && member.role !== "owner" && (
                  <button
                    onClick={() => removeMember(member.user_id)}
                    className="text-xs px-3 py-1 bg-red-600 rounded hover:bg-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= ACTIONS ================= */}
      <div className="flex gap-4">
        {!isOwner && (
          <button
            onClick={leaveTeam}
            className="px-4 py-2 bg-yellow-600 rounded hover:bg-yellow-700"
          >
            Leave Team
          </button>
        )}

        {isOwner && (
          <button
            onClick={deleteTeam}
            className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
          >
            Delete Team
          </button>
        )}
      </div>
    </div>
  );
}