const mongoose = require("mongoose");

const buddySchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  recipient: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined", "blocked"],
    default: "pending",
  },
  sharedGoals: [{ type: String, maxlength: 120 }],
  encouragements: [
    {
      from: { type: mongoose.Schema.ObjectId, ref: "User" },
      message: { type: String, maxlength: 280 },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  streakSync: {
    requesterStreak: { type: Number, default: 0 },
    recipientStreak: { type: Number, default: 0 },
    syncedAt: Date,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

buddySchema.index({ requester: 1, recipient: 1 }, { unique: true });
buddySchema.index({ recipient: 1, status: 1 });

module.exports = mongoose.model("Buddy", buddySchema);
