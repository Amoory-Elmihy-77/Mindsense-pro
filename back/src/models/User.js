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
          el
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
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
