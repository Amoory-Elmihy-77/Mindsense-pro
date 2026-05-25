const mongoose = require("mongoose");

const voiceSessionSchema = new mongoose.Schema({
  _id: {
    type: String,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ["idle", "starting", "active", "paused", "completed", "expired"],
    default: "starting",
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: {
    type: Date,
  },
  duration: {
    type: Number, // in seconds
    default: 0,
  },
  turnCount: {
    type: Number,
    default: 0,
  },
  emotionAtStart: {
    type: String,
  },
  emotionAtEnd: {
    type: String,
  },
  emotionTrajectory: [
    {
      emotion: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
  summary: {
    emotionChange: String,
    topics: [String],
    insights: [String],
    nextActions: [String],
    score: { type: Number, min: 0, max: 100 },
  },
  metadata: {
    planType: String,
    minutesConsumed: { type: Number, default: 0 },
    resumeCount: { type: Number, default: 0 },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date, // TTL index for auto-cleanup of non-completed sessions
  },
});

voiceSessionSchema.index({ user: 1, createdAt: -1 });
voiceSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const VoiceSession = mongoose.model("VoiceSession", voiceSessionSchema);

module.exports = VoiceSession;
