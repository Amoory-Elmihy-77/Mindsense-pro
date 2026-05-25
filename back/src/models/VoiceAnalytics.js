const mongoose = require("mongoose");

const voiceAnalyticsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sessionId: {
    type: String,
    ref: "VoiceSession",
  },
  event: {
    type: String,
    enum: ["session_start", "session_end", "turn", "dropout", "error", "feedback"],
    required: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // event-specific payload
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

voiceAnalyticsSchema.index({ user: 1, event: 1, createdAt: -1 });

// Automatically delete analytics after 180 days to save space
voiceAnalyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

const VoiceAnalytics = mongoose.model("VoiceAnalytics", voiceAnalyticsSchema);

module.exports = VoiceAnalytics;
