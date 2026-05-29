const mongoose = require("mongoose");

const groupSessionSchema = new mongoose.Schema({
  host: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  circle: { type: mongoose.Schema.ObjectId, ref: "Circle" },
  title: { type: String, required: true, trim: true },
  description: { type: String, maxlength: 700 },
  type: {
    type: String,
    enum: ["open", "scheduled", "professional"],
    default: "open",
  },
  capacity: { type: Number, default: 12, min: 2, max: 100 },
  durationMinutes: { type: Number, default: 45, min: 10, max: 180 },
  meeting: {
    provider: { type: String, default: "manual" },
    url: String,
    calendarUrl: String,
  },
  participants: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  status: {
    type: String,
    enum: ["open", "full", "completed", "cancelled"],
    default: "open",
  },
  startsAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

groupSessionSchema.index({ startsAt: 1, status: 1 });
groupSessionSchema.index({ circle: 1, startsAt: 1 });
groupSessionSchema.index({ host: 1, startsAt: -1 });

module.exports = mongoose.model("CommunityGroupSession", groupSessionSchema);
