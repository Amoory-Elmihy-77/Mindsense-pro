const User = require("../../models/User");
const sendEmail = require("../../utils/email");
const signToken = require("../../utils/jwtFactory");

// Forget password (send code)
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ status: "fail", message: "Invalid email" });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.passwordResetCode = resetCode;
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const message = `
      You have requested a password reset.

      Your code is: ${resetCode}

      This code is valid for 10 minutes only.

      `;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password recovery code - MindSense AI",
        message,
      });

      res.status(200).json({
        status: "success",
        message: "A password recovery code has been sent to your email.",
      });
    } catch (err) {
      user.passwordResetCode = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res
        .status(500)
        .json({ status: "error", message: "Failed to send email." });
    }
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// Verify Code Only
exports.verifyPassResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({
      email,
      passwordResetCode: code,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: "fail",
        message: "The code is invalid or has expired.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Correct code, now you can update your password",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const user = await User.findOne({
      email,
      passwordResetCode: code,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: "fail",
        message: "The code is invalid or has expired.",
      });
    }

    user.password = newPassword;

    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);

    res.status(200).json({
      status: "success",
      token,
      message: "The password has been successfully changed!",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
