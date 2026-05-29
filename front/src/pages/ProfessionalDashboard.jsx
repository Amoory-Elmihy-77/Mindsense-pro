import React, { useEffect, useState } from "react";
import useAuthStore from "../store/useAuthStore";
import api from "../lib/axios";
import SessionCard from "../components/SessionCard";
import AlertModal from "../components/AlertModal";

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://localhost:5020"}${path}`;
};

const paymentMethodLabel = {
  cash_transfer: "Cash wallet",
  instapay: "InstaPay",
};

const ProfessionalDashboard = () => {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ averageRating: "0.0" });

  const [alert, setAlert] = useState({ isOpen: false, title: "", message: "", type: "info" });

  useEffect(() => {
    fetchSessions();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/v1/professionals/my-stats");
      setStats(res.data.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await api.get("/v1/sessions/professional-sessions");
      setSessions(res.data.data.sessions);
    } catch (err) {
      console.error(err);
      setAlert({ isOpen: true, title: "Error", message: "Failed to load sessions.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      if (action === "delete") {
        await api.delete(`/v1/sessions/${id}`);
        setAlert({ isOpen: true, title: "Success", message: "Session deleted successfully.", type: "success" });
      } else {
        await api.post(`/v1/sessions/${id}/${action}`);
        setAlert({ isOpen: true, title: "Success", message: `Session ${action}ed successfully.`, type: "success" });
      }
      fetchSessions();
    } catch (err) {
      setAlert({ isOpen: true, title: "Action Failed", message: err.response?.data?.message || "Error taking action.", type: "error" });
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        width: "100%",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Professional Dashboard</h1>
      
      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 className="text-muted" style={{ fontWeight: "600", marginBottom: "0.5rem" }}>Total Revenue</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--success)" }}>0 EGP</p>
        </div>
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 className="text-muted" style={{ fontWeight: "600", marginBottom: "0.5rem" }}>Upcoming Sessions</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--text-primary)" }}>
            {sessions.filter((s) => ["accepted", "paid"].includes(s.status)).length}
          </p>
        </div>
        <div className="glass-panel" style={{ padding: "1.5rem" }}>
          <h3 className="text-muted" style={{ fontWeight: "600", marginBottom: "0.5rem" }}>Average Rating</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold", color: "#fbbf24" }}>
            {stats.averageRating} ★
          </p>
        </div>
      </div>

      {/* Sessions List */}
      <div className="glass-panel" style={{ padding: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ color: "#60a5fa" }}>📅</span> Bookings & Schedule
        </h2>

        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : sessions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {sessions.map((session) => (
              <SessionCard key={session._id} session={session} title={`User: ${session.user?.name || "Unknown User"}`}>
                
                {session.status === "pending" && (
                  <>
                    {session.payment_proof_image && (
                      <a
                        href={getImageUrl(session.payment_proof_image)}
                        target="_blank"
                        rel="noreferrer"
                        title="Open payment proof"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.65rem",
                          padding: "0.45rem 0.7rem",
                          border: "1px solid rgba(255,255,255,0.14)",
                          borderRadius: "var(--radius-md)",
                          background: "rgba(0,0,0,0.22)",
                          color: "var(--text-primary)",
                          textDecoration: "none",
                        }}
                      >
                        <img
                          src={getImageUrl(session.payment_proof_image)}
                          alt="Payment proof"
                          style={{
                            width: "52px",
                            height: "52px",
                            objectFit: "cover",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid rgba(255,255,255,0.16)",
                          }}
                        />
                        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                          <strong style={{ fontSize: "0.85rem" }}>Payment proof</strong>
                          <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                            {paymentMethodLabel[session.payment_method] || "Transfer"}
                          </span>
                          {session.payment_reference && (
                            <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                              Ref: {session.payment_reference}
                            </span>
                          )}
                        </span>
                      </a>
                    )}
                    <button
                      onClick={() => handleAction(session._id, "accept")}
                      className="btn btn-primary"
                      style={{ padding: "0.4rem 1rem", boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)" }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleAction(session._id, "reject")}
                      className="btn btn-secondary"
                      style={{ padding: "0.4rem 1rem" }}
                    >
                      Reject
                    </button>
                  </>
                )}

                {session.status === "accepted" && !session.doctor_seen && (
                  <button
                    onClick={() => handleAction(session._id, "seen")}
                    className="btn btn-primary"
                    style={{ padding: "0.4rem 1rem", boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)" }}
                  >
                    Mark as Seen
                  </button>
                )}

                {session.status === "paid" && (
                  <button
                    onClick={() => handleAction(session._id, "complete")}
                    className="btn btn-primary"
                    style={{ padding: "0.4rem 1rem", boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)" }}
                  >
                    Mark Completed
                  </button>
                )}

                {(session.doctor_seen || session.status === "rejected") && (
                  <button
                    onClick={() => handleAction(session._id, "delete")}
                    className="btn"
                    style={{ padding: "0.4rem 1rem", backgroundColor: "#ef4444", color: "white", border: "none", borderRadius: "0.5rem", fontWeight: "600", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                )}
              </SessionCard>
            ))}
          </div>
        ) : (
          <p className="text-muted" style={{ fontStyle: "italic", background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "0.5rem" }}>
            No sessions yet.
          </p>
        )}
      </div>

      {/* Followers */}
      <div className="glass-panel" style={{ padding: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ color: "#f472b6" }}>👥</span> Your Followers ({user?.followers?.length || 0})
        </h2>
        {user?.followers?.length > 0 ? (
          <ul style={{ listStyleType: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {user.followers.map((follower) => {
              const followerName = typeof follower === "object" ? follower.name : follower;
              const followerId = typeof follower === "object" ? follower._id : follower;
              return (
                <li
                  key={followerId}
                  style={{
                    padding: "0.75rem",
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem"
                  }}
                >
                  <span style={{ fontSize: "1.25rem" }}>👤</span> <span style={{ fontWeight: "500" }}>{followerName}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted" style={{ fontStyle: "italic", background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "0.5rem" }}>
            You don't have any followers yet. Build your profile and engage with users.
          </p>
        )}
      </div>

      <AlertModal
        isOpen={alert.isOpen}
        onClose={() => setAlert({ ...alert, isOpen: false })}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />
    </div>
  );
};

export default ProfessionalDashboard;
