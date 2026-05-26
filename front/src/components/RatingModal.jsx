import React, { useState } from "react";
import Modal from "./ui/Modal";

const RatingModal = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    if (rating < 1) return;
    onSubmit({ rating, comment });
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setRating(0);
    setHoveredRating(0);
    setComment("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Rate your Doctor"
      footer={
        <>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating < 1 || isSubmitting}
            className="btn btn-primary"
            style={{
              opacity: rating < 1 || isSubmitting ? 0.6 : 1,
              cursor: rating < 1 || isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Submitting..." : "Submit Rating"}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <p style={{ color: "#d1d5db" }}>
          How was your session? Please let us know by leaving a rating and an optional review below.
        </p>

        {/* Interactive Stars */}
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
              style={{
                fontSize: "3rem",
                color: star <= (hoveredRating || rating) ? "#fbbf24" : "rgba(255, 255, 255, 0.2)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                lineHeight: 1,
                transition: "transform 0.2s",
                transform: star === hoveredRating ? "scale(1.1)" : "scale(1)",
              }}
            >
              ★
            </button>
          ))}
        </div>
        <div style={{ textAlign: "center", fontSize: "0.875rem", fontWeight: "600", color: "#9ca3af", marginTop: "-10px" }}>
          {rating > 0 ? `${rating} out of 5 stars` : "Select a rating"}
        </div>

        {/* Comment Textarea */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label htmlFor="comment" style={{ fontSize: "0.875rem", fontWeight: "600", color: "#d1d5db" }}>
            Comments (Optional)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your experience..."
            style={{
              width: "100%",
              background: "rgba(0,0,0,0.4)",
              color: "white",
              borderRadius: "0.5rem",
              padding: "0.75rem",
              border: "1px solid rgba(255,255,255,0.1)",
              outline: "none",
              resize: "vertical",
              minHeight: "100px",
              fontFamily: "inherit",
              fontSize: "1rem"
            }}
          ></textarea>
        </div>
      </div>
    </Modal>
  );
};

export default RatingModal;
