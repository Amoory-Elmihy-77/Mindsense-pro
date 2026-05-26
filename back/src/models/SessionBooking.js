const mongoose = require("mongoose");

const sessionBookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Session must belong to a user"],
  },
  professional: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Session must belong to a professional"],
  },
  price: {
    type: Number,
    required: [true, "Session must have a price"],
  },
  status: {
    type: String,
    enum: [
      "pending",
      "accepted",
      "rejected",
      "paid",
      "completed",
      "refunded",
      "cancelled",
    ],
    default: "pending",
  },
  meeting_url: {
    type: String,
  },
  start_time: {
    type: Date,
    required: [true, "Session must have a start time"],
  },
  end_time: {
    type: Date,
    required: [true, "Session must have an end time"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  doctor_seen: {
    type: Boolean,
    default: false,
  },
});

const SessionBooking = mongoose.model("SessionBooking", sessionBookingSchema);

module.exports = SessionBooking;
