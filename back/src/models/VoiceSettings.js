const mongoose = require("mongoose");

const voiceSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  preferredLanguage: {
    type: String,
    enum: ["egyptian_arabic", "english"],
    default: "egyptian_arabic",
  },
  autoDetect: {
    type: Boolean,
    default: false,
  },
  voiceStyle: {
    type: String,
    enum: ["warm", "calm"],
    default: "warm",
  },
  speed: {
    type: Number,
    min: 80,
    max: 120,
    default: 100,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

voiceSettingsSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const VoiceSettings = mongoose.model("VoiceSettings", voiceSettingsSchema);

module.exports = VoiceSettings;
