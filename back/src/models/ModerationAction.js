const mongoose = require("mongoose");

const moderationActionSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  targetUser: { type: mongoose.Schema.ObjectId, ref: "User" },
  targetType: {
    type: String,
    enum: ["post", "comment", "room_message", "user", "report"],
    required: true,
  },
  targetId: { type: mongoose.Schema.Types.Mixed, required: true },
  action: {
    type: String,
    enum: ["warn", "mute", "hide", "ban", "approve", "dismiss", "remove"],
    required: true,
  },
  reason: { type: String, maxlength: 500 },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

moderationActionSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
moderationActionSchema.index({ actor: 1, createdAt: -1 });

module.exports = mongoose.model("ModerationAction", moderationActionSchema);
