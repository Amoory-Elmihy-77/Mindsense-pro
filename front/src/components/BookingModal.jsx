import React, { useState } from "react";
import axios from "../lib/axios";

const PAYMENT_OPTIONS = [
  { value: "cash_transfer", label: "Cash wallet", number: "01012345678" },
  { value: "instapay", label: "InstaPay", number: "01123456789" },
];

const BookingModal = ({ professional, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_OPTIONS[0].value);
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentReference, setPaymentReference] = useState("");

  const handleBook = async () => {
    if (!paymentProof) {
      alert("Please upload the money transfer screenshot before booking.");
      return;
    }

    setLoading(true);
    try {
      // Assuming naive implementation for next available session
      const startTime = new Date();
      startTime.setHours(startTime.getHours() + 24); // next day

      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1);

      const body = new FormData();
      body.append("professionalId", professional._id);
      body.append("start_time", startTime.toISOString());
      body.append("end_time", endTime.toISOString());
      body.append("payment_method", paymentMethod);
      body.append("payment_reference", paymentReference);
      body.append("paymentProof", paymentProof);

      await axios.post("/v1/sessions/book", body);

      alert("Booking request sent! The doctor will review your payment proof before accepting.");
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4"
      style={{ zIndex: 100, backdropFilter: "blur(5px)" }}
    >
      <div
        className="glass-panel p-6 max-w-md w-full"
        style={{ padding: "2rem" }}
      >
        <h3 className="text-xl font-bold mb-4">
          Book with {professional.name}
        </h3>
        <p className="text-muted mb-4">
          Price:{" "}
          <span style={{ color: "var(--accent-primary)", fontWeight: "bold" }}>
            {professional.professionalProfile.price_per_session} EGP
          </span>
        </p>

        <div
          style={{
            display: "grid",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}
        >
          {PAYMENT_OPTIONS.map((option) => (
            <label
              key={option.value}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                padding: "0.85rem",
                border: `1px solid ${paymentMethod === option.value ? "var(--accent-primary)" : "rgba(255,255,255,0.12)"}`,
                borderRadius: "var(--radius-md)",
                background: paymentMethod === option.value ? "rgba(59,130,246,0.12)" : "rgba(0,0,0,0.18)",
                cursor: "pointer",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.value}
                  checked={paymentMethod === option.value}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                />
                <span>
                  <strong>{option.label}</strong>
                  <span className="text-muted" style={{ display: "block", fontSize: "0.85rem" }}>
                    Transfer number
                  </span>
                </span>
              </span>
              <strong style={{ color: "var(--text-primary)" }}>{option.number}</strong>
            </label>
          ))}
        </div>

        <label className="text-muted" style={{ display: "block", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
          Transfer reference or sender phone
        </label>
        <input
          type="text"
          value={paymentReference}
          onChange={(event) => setPaymentReference(event.target.value)}
          placeholder="Optional"
          style={{
            width: "100%",
            padding: "0.75rem",
            marginBottom: "1rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.2)",
            color: "var(--text-primary)",
          }}
        />

        <label className="text-muted" style={{ display: "block", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
          Money transfer screenshot
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => setPaymentProof(event.target.files?.[0] || null)}
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(0,0,0,0.2)",
            color: "var(--text-primary)",
          }}
        />
        <div className="flex gap-4 justify-end mt-4">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleBook}
            disabled={loading}
            className="btn btn-primary"
            style={{
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Processing..." : "Submit Booking"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
