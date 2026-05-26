const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Review must belong to a user"],
  },
  professional: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Review must belong to a professional"],
  },
  sessionBooking: {
    type: mongoose.Schema.ObjectId,
    ref: "SessionBooking",
    required: [true, "Review must belong to a session"],
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, "Review must have a rating"],
  },
  comment: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
