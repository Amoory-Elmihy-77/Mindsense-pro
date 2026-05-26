import React, { useState } from "react";
import axios from "../lib/axios";

const BookingModal = ({ professional, onClose }) => {
  const [loading, setLoading] = useState(false);

  const handleBook = async () => {
    setLoading(true);
    try {
      // Assuming naive implementation for next available session
      const startTime = new Date();
      startTime.setHours(startTime.getHours() + 24); // next day

      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1);

      const res = await axios.post("/v1/sessions/book", {
        professionalId: professional._id,
        start_time: startTime,
        end_time: endTime,
      });

      alert("Booking request sent! Waiting for professional to accept.");
      onClose();
    } catch (err) {
      console.error(err);
      alert("Booking failed");
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
            {loading ? "Processing..." : "Confirm & Pay"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
