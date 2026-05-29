const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.ObjectId, ref: "User", required: true, index: true },
  type: {
    type: String,
    enum: ["challenge", "comment", "buddy", "circle", "session", "moderation", "achievement"],
    required: true,
  },
  title: { type: String, required: true },
  body: { type: String, required: true },
  link: String,
  readAt: Date,
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    push: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
  },
});

notificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("CommunityNotification", notificationSchema);
