const mongoose = require("mongoose");

const communityCommentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.ObjectId, ref: "CommunityPost", required: true, index: true },
  author: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  content: { type: String, required: true, maxlength: 600 },
  visibility: {
    type: String,
    enum: ["public", "nickname", "anonymous"],
    default: "nickname",
  },
  displayAuthor: {
    name: String,
    avatarSeed: String,
    mode: String,
  },
  status: {
    type: String,
    enum: ["pending_review", "published", "hidden", "removed"],
    default: "published",
  },
  createdAt: { type: Date, default: Date.now },
});

communityCommentSchema.index({ post: 1, createdAt: 1 });

module.exports = mongoose.model("CommunityComment", communityCommentSchema);
