const mongoose = require("mongoose");

const conversationMessageSchema = new mongoose.Schema({
  session: {
    type: String,
    ref: "VoiceSession",
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  emotion: {
    type: String, // detected emotion at this turn
  },
  turnIndex: {
    type: Number,
  },
  duration: {
    type: Number, // audio duration in seconds
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 90 * 24 * 60 * 60 * 1000), // 90 days TTL
  },
});

conversationMessageSchema.index({ session: 1, turnIndex: 1 });
conversationMessageSchema.index({ user: 1, createdAt: -1 });
conversationMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ConversationMessage = mongoose.model("ConversationMessage", conversationMessageSchema);

module.exports = ConversationMessage;
