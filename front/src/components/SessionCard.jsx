import React from "react";

const getStatusColor = (status) => {
  switch (status) {
    case "pending":
      return "var(--warning)";
    case "accepted":
    case "paid":
      return "var(--accent-primary)";
    case "completed":
      return "var(--success)";
    case "rejected":
    case "cancelled":
    case "refunded":
      return "#ef4444"; // red
    default:
      return "var(--text-secondary)";
  }
};

const SessionCard = ({ session, title, children }) => {
  const statusColor = getStatusColor(session.status);

  return (
    <div
      className="transition-all hover:bg-opacity-30"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1.25rem",
        background: "rgba(0,0,0,0.2)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "var(--radius-md)",
      }}
    >
      <div className="flex flex-col gap-1">
        <h4 className="text-lg font-bold text-white">
          {title}
        </h4>
        <p className="text-muted" style={{ fontSize: "0.9rem" }}>
          {new Date(session.start_time).toLocaleString()}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span
            style={{
              padding: "0.2rem 0.6rem",
              borderRadius: "999px",
              backgroundColor: `${statusColor}20`,
              color: statusColor,
              border: `1px solid ${statusColor}40`,
              fontSize: "0.8rem",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {session.status}
          </span>
          <span style={{ fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: "500", marginLeft: "0.5rem" }}>
            {session.price} EGP
          </span>
        </div>

        {session.meeting_url && (
          <a
            href={session.meeting_url}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-blue-400"
            style={{
              color: "var(--accent-primary)",
              fontSize: "0.9rem",
              textDecoration: "underline",
              marginTop: "0.5rem",
              display: "inline-block",
              fontWeight: "500",
            }}
          >
            Join Google Meet
          </a>
        )}
      </div>

      {/* Action Buttons Slot */}
      {children && (
        <div className="flex gap-2 flex-wrap justify-end ml-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default SessionCard;
