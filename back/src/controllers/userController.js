const User = require("../models/User");
const signToken = require("../utils/jwtFactory");
const sendEmail = require("../utils/email");

// Helpful function to filter the data that the user is allowed to edit only
// (so that they cannot change their balance, for example, or change their status to administrator)
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// 1. Get Current User Data
exports.getMe = (req, res, next) => {
  res.status(200).json({
    status: "success",
    data: {
      user: req.user,
    },
  });
};

// 2. Update My Data
exports.updateMe = async (req, res) => {
  try {
    if (req.body.password || req.body.passwordConfirm) {
      return res.status(400).json({
        status: "fail",
        message:
          "This link is not for changing your password. Use /updateMyPassword",
      });
    }

    const filteredBody = filterObj(req.body, "name", "email", "age");

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// 3. Update My Password
exports.updateMyPassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("+password");

    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      return res.status(401).json({
        status: "fail",
        message: "The current password is incorrect.",
      });
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    const token = signToken(user._id);

    res.status(200).json({
      status: "success",
      token,
      message: "The password has been successfully changed.",
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

// 4. Notify Trusted Contact
exports.notifyTrustedContact = async (req, res) => {
  try {
    const { state, note } = req.body;

    if (!state) {
      return res.status(400).json({
        status: "fail",
        message: "state is required",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user.trustedContact || user.trustedContact.status !== "accepted") {
      return res.status(400).json({
        status: "fail",
        message: "No accepted trusted contact found",
      });
    }

    const message = `Hello ${user.trustedContact.name},\n\n${user.name} may be experiencing a high stress state (${state}).\n${note ? `Note: ${note}\n` : ""}\nPlease check in with them when possible.\n\nMindSense AI`;

    await sendEmail({
      email: user.trustedContact.email,
      subject: "MindSense AI alert for a trusted contact",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Trusted contact notified successfully",
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};
