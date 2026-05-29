const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
  },
  age: {
    type: Number,
    required: [true, "Please enter you age"],
    min: [8, "Age must be 8 or above"],
    max: [100, "Invalid age"],
  },
  profileImage: {
    type: String,
    default: "",
  },
  email: {
    type: String,
    required: [true, "Please enter your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Invalid email"],
  },
  password: {
    type: String,
    required: [true, "Please enter password"],
    minlength: [8, "Password must be at least 8 characters"],
    validate: {
      validator: function (el) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
          el,
        );
      },
      message:
        "Weak password: Must contain an uppercase letter, a lowercase letter, a number, and a special character (@$!%*?&)",
    },
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm password"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Password and confirmation do not match",
    },
  },
  // --- Verification ---
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationCode: {
    type: String,
    select: false,
  },
  verificationCodeExpires: {
    type: Date,
    select: false,
  },

  // --- Reset Password ---
  passwordResetCode: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },

  // --- (Trusted Contact) ---
  trustedContact: {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    relationship: { type: String },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    confirmationToken: String,
  },

  // --- Professional Support Marketplace Extension ---
  role: {
    type: String,
    enum: ["user", "premium", "professional", "community_moderator", "admin"],
    default: "user",
  },
  communityProfile: {
    nickname: { type: String },
    avatarSeed: { type: String },
    defaultVisibility: {
      type: String,
      enum: ["public", "nickname", "anonymous"],
      default: "nickname",
    },
    joinedCircles: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Circle",
      },
    ],
    reputation: {
      supportScore: { type: Number, default: 0 },
      consistency: { type: Number, default: 0 },
      contribution: { type: Number, default: 0 },
      helpful: { type: Number, default: 0 },
      trust: { type: Number, default: 50 },
      level: { type: Number, default: 1 },
    },
    privacy: {
      showProgress: { type: Boolean, default: true },
      allowBuddyInvites: { type: Boolean, default: true },
      shareCircleStats: { type: Boolean, default: false },
    },
  },
  following: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
  followers: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
  professionalProfile: {
    headline: { type: String },
    bio: { type: String },
    languages: [{ type: String }],
    experience: { type: String },
    price_per_session: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    availability: [
      {
        day: { type: Number, min: 0, max: 6 }, // 0 = Sunday, 1 = Monday, etc.
        start_time: { type: String }, // e.g., "09:00"
        end_time: { type: String }, // e.g., "17:00"
      },
    ],
  },

  // ── Gamification ──────────────────────────────────────────────────────────
  gamification: {
    xp:          { type: Number, default: 0 },
    points:      { type: Number, default: 0 },
    streak_days: { type: Number, default: 0 },
    last_played: { type: Date,   default: null },
    past_sessions: [
      {
        game_name:  { type: String },
        game_type:  { type: String },
        emotion:    { type: String },
        score:      { type: Number, default: 0 },
        xp_earned:  { type: Number, default: 0 },
        date:       { type: Date, default: Date.now },
      },
    ],
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Password encoding
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
