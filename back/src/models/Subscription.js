const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  plan: {
    type: String,
    enum: ["free", "plus", "pro"],
    default: "free",
  },
  status: {
    type: String,
    enum: ["active", "cancelled", "expired", "trial"],
    default: "active",
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date, // null means never expires (or auto-renews until cancelled)
  },
  limits: {
    minutesPerPeriod: { type: Number, default: 10 }, // 10 for free, 200 for plus, 999999 for pro
    sessionsPerPeriod: { type: Number, default: 5 }, // 5 for free, 999999 for others
    period: { type: String, enum: ["week", "month"], default: "week" },
  },
  features: {
    summaries: { type: Boolean, default: false },
    extendedMemory: { type: Boolean, default: false },
    priority: { type: Boolean, default: false },
  },
  billingId: {
    type: String, // e.g., Stripe subscription ID
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = Subscription;
