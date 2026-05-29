const mongoose = require("mongoose");

const communityPostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  circle: { type: mongoose.Schema.ObjectId, ref: "Circle" },
  type: {
    type: String,
    enum: ["reflection", "achievement", "progress", "challenge_update", "encouragement", "question"],
    required: true,
  },
  content: { type: String, required: true, minlength: 2, maxlength: 1200 },
  visibility: {
    type: String,
    enum: ["public", "nickname", "anonymous"],
    default: "nickname",
  },
  displayAuthor: {
    name: String,
    avatarSeed: String,
    mode: { type: String, enum: ["public", "nickname", "anonymous"], default: "nickname" },
  },
  status: {
    type: String,
    enum: ["pending_review", "published", "hidden", "removed"],
    default: "pending_review",
  },
  moderation: {
    score: { type: Number, default: 0 },
    labels: [{ type: String }],
    reason: String,
    reviewedBy: { type: mongoose.Schema.ObjectId, ref: "User" },
    reviewedAt: Date,
  },
  reactions: [
    {
      user: { type: mongoose.Schema.ObjectId, ref: "User" },
      type: { type: String, enum: ["support", "helpful", "inspired", "proud"], default: "support" },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  savedBy: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  shareCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  reportCount: { type: Number, default: 0 },
  trendingScore: { type: Number, default: 0 },
  editedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

communityPostSchema.index({ status: 1, createdAt: -1 });
communityPostSchema.index({ circle: 1, status: 1, createdAt: -1 });
communityPostSchema.index({ author: 1, createdAt: -1 });
communityPostSchema.index({ trendingScore: -1, createdAt: -1 });

module.exports = mongoose.model("CommunityPost", communityPostSchema);
