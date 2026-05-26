const sessionService = require("../services/sessionService");

exports.bookSession = async (req, res) => {
  try {
    const { professionalId, start_time, end_time } = req.body;
    const session = await sessionService.bookSession(
      req.user.id,
      professionalId,
      start_time,
      end_time,
    );
    res.status(201).json({ status: "success", data: { session } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.paySession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await sessionService.payForSession(sessionId, req.user.id);
    res.status(200).json({ status: "success", data: { session } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.rateSession = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const review = await sessionService.rateSession(req.params.id, req.user.id, rating, comment);
    res.status(201).json({ status: "success", data: { review } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.acceptSession = async (req, res) => {
  try {
    const session = await sessionService.acceptSession(
      req.params.id,
      req.user.id,
    );
    res.status(200).json({ status: "success", data: { session } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.rejectSession = async (req, res) => {
  try {
    const session = await sessionService.rejectSession(
      req.params.id,
      req.user.id,
    );
    res.status(200).json({ status: "success", data: { session } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.completeSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    // Assuming req.user is the professional marking it complete
    const session = await sessionService.completeSession(
      sessionId,
      req.user.id,
    );
    res.status(200).json({ status: "success", data: { session } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.markAsSeen = async (req, res) => {
  try {
    const session = await sessionService.markAsSeen(req.params.id, req.user.id);
    res.status(200).json({ status: "success", data: { session } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    await sessionService.deleteSession(req.params.id, req.user.id);
    res.status(204).json({ status: "success", data: null });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.getProfessionalSessions = async (req, res) => {
  try {
    const sessions = await sessionService.getProfessionalSessions(req.user.id);
    res.status(200).json({ status: "success", data: { sessions } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.getUserSessions = async (req, res) => {
  try {
    const sessions = await sessionService.getUserSessions(req.user.id);
    res.status(200).json({ status: "success", data: { sessions } });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};
