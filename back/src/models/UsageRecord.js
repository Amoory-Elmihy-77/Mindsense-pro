const mongoose = require("mongoose");

const usageRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  period: {
    type: String, // e.g., '2026-W21' or '2026-05'
    required: true,
  },
  periodType: {
    type: String,
    enum: ["week", "month"],
    required: true,
  },
  minutesUsed: {
    type: Number,
    default: 0,
  },
  sessionsUsed: {
    type: Number,
    default: 0,
  },
  tokensUsed: {
    type: Number,
    default: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

usageRecordSchema.index({ user: 1, period: 1 }, { unique: true });

const UsageRecord = mongoose.model("UsageRecord", usageRecordSchema);

module.exports = UsageRecord;
