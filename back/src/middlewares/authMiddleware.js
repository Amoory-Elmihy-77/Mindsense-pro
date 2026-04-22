const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "fail",
        message: "Please login first",
      });
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: "fail",
        message: "The user associated with this token no longer exists.",
      });
    }

    req.user = currentUser;
    next();
  } catch (err) {
    return res.status(401).json({ status: "fail", message: "Invalid token" });
  }
};
