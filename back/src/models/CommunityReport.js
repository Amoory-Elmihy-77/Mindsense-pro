const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  targetType: {
    type: String,
    enum: ["post", "comment", "room_message", "user"],
    required: true,
  },
  targetId: { type: mongoose.Schema.Types.Mixed, required: true },
  reason: {
    type: String,
    enum: ["medical_advice", "diagnosis", "spam", "harassment", "unsafe", "privacy", "other"],
    required: true,
  },
  note: { type: String, maxlength: 500 },
  status: {
    type: String,
    enum: ["open", "reviewing", "resolved", "dismissed"],
    default: "open",
  },
  reviewedBy: { type: mongoose.Schema.ObjectId, ref: "User" },
  resolution: String,
  createdAt: { type: Date, default: Date.now },
  reviewedAt: Date,
});

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model("CommunityReport", reportSchema);
