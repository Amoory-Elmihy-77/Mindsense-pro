const mongoose = require("mongoose");

const circleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true, maxlength: 500 },
  tags: [{ type: String, lowercase: true, trim: true }],
  rules: [{ type: String, maxlength: 240 }],
  admins: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  moderators: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  members: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  memberCount: { type: Number, default: 0 },
  visibility: {
    type: String,
    enum: ["public", "private"],
    default: "public",
  },
  premiumOnly: { type: Boolean, default: false },
  stats: {
    posts: { type: Number, default: 0 },
    checkIns: { type: Number, default: 0 },
    challengeCompletions: { type: Number, default: 0 },
  },
  createdBy: { type: mongoose.Schema.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

circleSchema.index({ slug: 1 });
circleSchema.index({ tags: 1, memberCount: -1 });

module.exports = mongoose.model("Circle", circleSchema);
