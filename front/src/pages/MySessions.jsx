import React, { useEffect, useState } from "react";
import api from "../lib/axios";
import SessionCard from "../components/SessionCard";
import AlertModal from "../components/AlertModal";
import RatingModal from "../components/RatingModal";

const MySessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [alert, setAlert] = useState({ isOpen: false, title: "", message: "", type: "info" });
  const [ratingModal, setRatingModal] = useState({ isOpen: false, sessionId: null });
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get("/v1/sessions/my-sessions");
      setSessions(res.data.data.sessions);
    } catch (err) {
      console.error(err);
      setAlert({ isOpen: true, title: "Error", message: "Failed to load sessions.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleRateSubmit = async ({ rating, comment }) => {
    if (!ratingModal.sessionId) return;
    setIsSubmittingRating(true);
    try {
      await api.post(`/v1/sessions/${ratingModal.sessionId}/rate`, { rating, comment });
      setRatingModal({ isOpen: false, sessionId: null });
      setAlert({ isOpen: true, title: "Thank You!", message: "Your rating has been submitted successfully.", type: "success" });
      fetchSessions();
    } catch (err) {
      setAlert({ isOpen: true, title: "Rating Failed", message: err.response?.data?.message || "Failed to submit rating.", type: "error" });
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const activeStatuses = ["pending", "accepted", "paid"];
  const activeSessions = sessions.filter((s) => activeStatuses.includes(s.status));
  const historySessions = sessions.filter((s) => !activeStatuses.includes(s.status));

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
      <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", marginBottom: "0.5rem" }}>My Appointments</h1>
      
      {/* Active Sessions */}
      <div className="glass-panel" style={{ padding: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ color: "#60a5fa" }}>📅</span> Active Sessions
        </h2>
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : activeSessions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {activeSessions.map((session) => (
              <SessionCard key={session._id} session={session} title={`Dr. ${session.professional?.name || "Unknown"}`}>
                {session.status === "pending" && (
                  <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                    Payment proof under review
                  </span>
                )}
                {session.status === "accepted" && (
                  <span style={{ color: "var(--success)", fontWeight: "600", fontSize: "0.9rem" }}>
                    Payment verified
                  </span>
                )}
                {session.status === "paid" && (
                  <span style={{ color: "var(--success)", fontWeight: "600", fontSize: "0.9rem" }}>
                    Payment verified
                  </span>
                )}
              </SessionCard>
            ))}
          </div>
        ) : (
          <p className="text-muted" style={{ fontStyle: "italic", background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "0.5rem" }}>
            You have no active session bookings.
          </p>
        )}
      </div>

      {/* Session History */}
      <div className="glass-panel" style={{ padding: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ color: "#9ca3af" }}>🕒</span> Session History
        </h2>
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : historySessions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {historySessions.map((session) => (
              <SessionCard key={session._id} session={session} title={`Dr. ${session.professional?.name || "Unknown"}`}>
                {session.status === "completed" && (
                  <button
                    onClick={() => setRatingModal({ isOpen: true, sessionId: session._id })}
                    className="btn btn-secondary"
                    style={{ padding: "0.4rem 1rem", border: "1px solid rgba(59, 130, 246, 0.3)" }}
                  >
                    ⭐ Rate Doctor
                  </button>
                )}
              </SessionCard>
            ))}
          </div>
        ) : (
          <p className="text-muted" style={{ fontStyle: "italic", background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "0.5rem" }}>
            You have no session history yet.
          </p>
        )}
      </div>

      {/* Modals */}
      <AlertModal
        isOpen={alert.isOpen}
        onClose={() => setAlert({ ...alert, isOpen: false })}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />

      <RatingModal
        isOpen={ratingModal.isOpen}
        onClose={() => setRatingModal({ isOpen: false, sessionId: null })}
        onSubmit={handleRateSubmit}
        isSubmitting={isSubmittingRating}
      />
    </div>
  );
};

export default MySessions;
