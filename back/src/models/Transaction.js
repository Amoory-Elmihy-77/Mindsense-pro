const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  wallet: {
    type: mongoose.Schema.ObjectId,
    ref: "Wallet",
    required: [true, "Transaction must belong to a wallet"],
  },
  sessionBooking: {
    type: mongoose.Schema.ObjectId,
    ref: "SessionBooking",
  },
  amount: {
    type: Number,
    required: [true, "Transaction must have an amount"],
  },
  type: {
    type: String,
    enum: ["credit", "debit", "fee"],
    required: [true, "Transaction must have a type"],
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending",
  },
  description: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
