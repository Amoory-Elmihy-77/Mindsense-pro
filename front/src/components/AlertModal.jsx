import React from "react";
import Modal from "./ui/Modal";

const AlertModal = ({ isOpen, onClose, title, message, type = "info" }) => {
  // Define styles based on alert type
  let colorClass = "#60a5fa"; // blue-400
  let icon = "ℹ️";

  if (type === "success") {
    colorClass = "#34d399"; // emerald-400
    icon = "✅";
  } else if (type === "error") {
    colorClass = "#f87171"; // red-400
    icon = "❌";
  } else if (type === "warning") {
    colorClass = "#fbbf24"; // amber-400
    icon = "⚠️";
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "1.5rem" }}>{icon}</span>
          <span style={{ color: colorClass }}>{title}</span>
        </div>
      }
      footer={
        <button onClick={onClose} className="btn btn-primary" style={{ padding: "0.5rem 1.5rem" }}>
          OK
        </button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p style={{ color: "#d1d5db", fontSize: "1.125rem" }}>{message}</p>
      </div>
    </Modal>
  );
};

export default AlertModal;
