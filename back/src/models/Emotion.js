const mongoose = require("mongoose");

const emotionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Emotion must belong to a user"],
  },
  source: {
    type: String,
    enum: ["face", "voice", "fusion"],
    required: [true, "Emotion source is required"],
  },
  state: {
    type: String,
    required: [true, "Detected emotion state is required"],
  },
  confidence: {
    type: Number,
    min: [0, "Confidence must be >= 0"],
    max: [1, "Confidence must be <= 1"],
  },
  raw: {
    type: mongoose.Schema.Types.Mixed,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Emotion = mongoose.model("Emotion", emotionSchema);

module.exports = Emotion;
