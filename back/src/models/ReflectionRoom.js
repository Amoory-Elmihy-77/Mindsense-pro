const mongoose = require("mongoose");

const reflectionRoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  type: {
    type: String,
    enum: ["study", "focus", "night", "weekend", "custom"],
    default: "custom",
  },
  prompts: [{ type: String }],
  participants: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
  activeCount: { type: Number, default: 0 },
  isVoiceEnabled: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

reflectionRoomSchema.index({ slug: 1 });
reflectionRoomSchema.index({ type: 1, activeCount: -1 });

module.exports = mongoose.model("ReflectionRoom", reflectionRoomSchema);
