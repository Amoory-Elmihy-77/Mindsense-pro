const User = require("../../models/User");
const sendEmail = require("../../utils/email");
const signToken = require("../../utils/jwtFactory");

// SignUp
exports.signup = async (req, res) => {
  try {
    const { name, email, password, passwordConfirm, age } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ status: "fail", message: "This email is already token" });
    }

    // Generate verification code
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser = await User.create({
      name,
      email,
      password,
      passwordConfirm,
      age,
      verificationCode: verifyCode,
      verificationCodeExpires: Date.now() + 10 * 60 * 1000,
    });

    const message = `Hello ${name},\n\nYour activation code for MindSense AI is:\n${verifyCode}\n\nThis code is valid for 10 minutes.`;

    try {
      await sendEmail({
        email: newUser.email,
        subject: "Account activation code - MindSense AI",
        message: message,
      });

      res.status(201).json({
        status: "success",
        message:
          "Registration successful! Check your email for the activation code.",
      });
    } catch (err) {
      // Delete user to resignup
      await User.findByIdAndDelete(newUser._id);
      return res.status(500).json({
        status: "error",
        message: "An error occurred while sending the email. Please try again.",
      });
    }
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// Verify Account
exports.verifyAccount = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email }).select(
      "+verificationCode +verificationCodeExpires"
    );

    if (!user) {
      return res
        .status(400)
        .json({ status: "fail", message: "User not found" });
    }

    if (
      user.verificationCode !== code ||
      user.verificationCodeExpires < Date.now()
    ) {
      return res.status(400).json({
        status: "fail",
        message: "The code is invalid or has expired.",
      });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);

    res.status(200).json({
      status: "success",
      token,
      data: {
        user,
      },
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please enter your email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: "fail",
        message: "wrong email or password",
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        status: "fail",
        message: "Please activate your account first.",
      });
    }

    const token = signToken(user._id);
    res.status(200).json({
      status: "success",
      token,
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// Resend Verification Code
exports.resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "This email address is not registered.",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        status: "fail",
        message: "This account is already active, you can log in.",
      });
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.verificationCode = newCode;
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const message = `Your new activation code is:\n${newCode}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "New activation code - MindSense AI",
        message,
      });

      res.status(200).json({
        status: "success",
        message: "A new code has been sent to your email.",
      });
    } catch (err) {
      user.verificationCode = undefined;
      user.verificationCodeExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res
        .status(500)
        .json({ status: "error", message: "Email sending failed" });
    }
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};
