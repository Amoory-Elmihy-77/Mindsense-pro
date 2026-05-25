const voiceService = require("../services/voiceService");
const subscriptionService = require("../services/subscriptionService");

exports.startSession = async (req, res) => {
  try {
    const { emotion } = req.body;
    const result = await voiceService.startSession(req.user.id, emotion || "Neutral");
    
    res.status(200).json({
      status: "success",
      data: result
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ status: "error", message: err.message });
  }
};

exports.processMessage = async (req, res) => {
  try {
    const { sessionId, emotion } = req.body;
    if (!sessionId) {
      return res.status(400).json({ status: "fail", message: "Session ID is required" });
    }
    if (!req.file) {
      return res.status(400).json({ status: "fail", message: "Audio file is required" });
    }

    const filePayload = {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
    };

    const result = await voiceService.processMessage(
      sessionId,
      req.user.id,
      emotion || "Neutral",
      filePayload,
      req.usage
    );

    res.status(200).json({
      status: "success",
      data: result
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ status: "error", message: err.message });
  }
};

exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ status: "fail", message: "Session ID is required" });
    }

    const summary = await voiceService.endSession(sessionId, req.user.id);

    res.status(200).json({
      status: "success",
      data: { summary }
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ status: "error", message: err.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const history = await voiceService.getHistory(req.user.id, limit);
    
    res.status(200).json({
      status: "success",
      results: history.length,
      data: history
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.checkSubscription = async (req, res) => {
  try {
    const quota = await subscriptionService.checkQuota(req.user.id);
    res.status(200).json({
      status: "success",
      data: quota,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.resetUsage = async (req, res) => {
  if (process.env.NODE_ENV === "production" && process.env.VOICE_DEV_UNLIMITED !== "true") {
    return res.status(403).json({ status: "fail", message: "Not available in production" });
  }

  try {
    const quota = await subscriptionService.resetCurrentPeriodUsage(req.user.id);
    res.status(200).json({
      status: "success",
      message: "Usage reset for current period",
      data: quota,
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
