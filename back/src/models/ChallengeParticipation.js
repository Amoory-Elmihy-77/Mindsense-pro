const mongoose = require("mongoose");

const participationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  challenge: { type: mongoose.Schema.ObjectId, ref: "Challenge", required: true },
  circle: { type: mongoose.Schema.ObjectId, ref: "Circle" },
  status: {
    type: String,
    enum: ["active", "completed", "abandoned"],
    default: "active",
  },
  completedTasks: [{ type: mongoose.Schema.ObjectId }],
  progress: { type: Number, default: 0, min: 0, max: 100 },
  xpEarned: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  completedAt: Date,
});

participationSchema.index({ user: 1, challenge: 1 }, { unique: true });
participationSchema.index({ challenge: 1, status: 1 });

module.exports = mongoose.model("ChallengeParticipation", participationSchema);
