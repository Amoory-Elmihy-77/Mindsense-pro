const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  key: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  category: {
    type: String,
    enum: ["consistency", "support", "challenge", "circle", "premium"],
    default: "challenge",
  },
  earnedAt: { type: Date, default: Date.now },
});

badgeSchema.index({ user: 1, key: 1 }, { unique: true });

module.exports = mongoose.model("CommunityBadge", badgeSchema);
