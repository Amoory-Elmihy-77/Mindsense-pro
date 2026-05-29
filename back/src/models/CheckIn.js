const mongoose = require("mongoose");

const checkInSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  circle: { type: mongoose.Schema.ObjectId, ref: "Circle" },
  mood: {
    type: String,
    enum: ["happy", "neutral", "sad", "angry", "anxious", "tired", "focused"],
    required: true,
  },
  energy: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  reflection: { type: String, maxlength: 1000 },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  summary: { type: String },
  xpEarned: { type: Number, default: 15 },
  publishPost: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

checkInSchema.index({ user: 1, createdAt: -1 });
checkInSchema.index({ circle: 1, createdAt: -1 });

module.exports = mongoose.model("CheckIn", checkInSchema);
