const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    xp: { type: Number, default: 10 },
  },
  { _id: true },
);

const challengeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ["breathing", "focus", "walk", "journaling", "consistency", "group"],
    required: true,
  },
  circle: { type: mongoose.Schema.ObjectId, ref: "Circle" },
  durationDays: { type: Number, default: 1, min: 1, max: 90 },
  xp: { type: Number, default: 50 },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "easy",
  },
  tasks: [taskSchema],
  badgeKey: String,
  isPremium: { type: Boolean, default: false },
  startsAt: Date,
  endsAt: Date,
  createdBy: { type: mongoose.Schema.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

challengeSchema.index({ type: 1, startsAt: -1 });
challengeSchema.index({ circle: 1, startsAt: -1 });

module.exports = mongoose.model("Challenge", challengeSchema);
