const mongoose = require("mongoose");

const roomMessageSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.ObjectId, ref: "ReflectionRoom", required: true },
  author: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  content: { type: String, required: true, maxlength: 700 },
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
  createdAt: { type: Date, default: Date.now },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  },
});

roomMessageSchema.index({ room: 1, createdAt: -1 });
roomMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("RoomMessage", roomMessageSchema);
