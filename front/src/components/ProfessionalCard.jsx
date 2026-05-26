import React, { useState } from "react";
import BookingModal from "./BookingModal";
import useAuthStore from "../store/useAuthStore";

const ProfessionalCard = ({ professional }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, followProfessional } = useAuthStore();
  const profile = professional.professionalProfile;

  // Check if following, robust to user structure (arrays could be objects populated vs purely arrays of ids)
  const isFollowing = user?.following?.some((f) =>
    typeof f === "object" ? f._id === professional._id : f === professional._id,
  );

  const handleFollowToggle = async () => {
    setIsLoading(true);
    await followProfessional(professional._id);
    setIsLoading(false);
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        width: "100%",
      }}
    >
      <h2 style={{ fontSize: "1.5rem", fontWeight: "600" }}>
        {professional.name}
      </h2>
      <p className="text-muted" style={{ fontSize: "0.95rem" }}>
        {profile.headline}
      </p>
      <p style={{ color: "var(--text-primary)", marginBottom: "0.5rem" }}>
        {profile.bio}
      </p>

      <div
        className="flex justify-between items-center"
        style={{ marginBottom: "1rem" }}
      >
        <span style={{ color: "var(--accent-primary)", fontWeight: "bold" }}>
          {profile.price_per_session} EGP / Session
        </span>
        <div className="flex gap-2 text-xs text-muted">
          {profile.languages.map((lang) => (
            <span
              key={lang}
              style={{
                background: "rgba(255,255,255,0.1)",
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
              }}
            >
              {lang}
            </span>
          ))}
        </div>
      </div>

      {user?.role === "user" && (
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <button
            onClick={handleFollowToggle}
            disabled={isLoading}
            className={`btn ${isFollowing ? "btn-secondary" : "btn-primary"}`}
            style={{ flex: 1 }}
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </button>

          {isFollowing && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              Book Session
            </button>
          )}
        </div>
      )}

      {isModalOpen && (
        <BookingModal
          professional={professional}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ProfessionalCard;
