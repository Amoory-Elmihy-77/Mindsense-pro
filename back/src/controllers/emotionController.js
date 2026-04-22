const emotionService = require("../services/emotionService");

exports.detectFace = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Face image file is required" });
    }

    const { result, emotion, advice, contactNotified } = await emotionService.detectFaceAndSave(
      req.user.id,
      req.file.buffer,
    );

    res.json({ analysis: result, emotion, advice, contactNotified });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.detectVoice = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Voice audio file is required" });
    }

    const { result, emotion, advice, contactNotified } = await emotionService.detectVoiceAndSave(
      req.user.id,
      {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
      },
    );

    res.json({ analysis: result, emotion, advice, contactNotified });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.detectAll = async (req, res) => {
  try {
    const faceFile = req.files?.face?.[0];
    const voiceFile = req.files?.voice?.[0];

    if (!faceFile || !voiceFile) {
      return res
        .status(400)
        .json({ error: "Both face and voice files are required" });
    }

    const { result, emotion, advice, contactNotified } = await emotionService.detectAllAndSave(
      req.user.id,
      {
        buffer: faceFile.buffer,
        originalname: faceFile.originalname,
        mimetype: faceFile.mimetype,
      },
      {
        buffer: voiceFile.buffer,
        originalname: voiceFile.originalname,
        mimetype: voiceFile.mimetype,
      },
    );

    res.json({ analysis: result, emotion, advice, contactNotified });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const source = req.query.source;
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;

    const history = await emotionService.getHistory(req.user.id, {
      limit,
      source,
      from,
      to,
    });

    res
      .status(200)
      .json({ status: "success", results: history.length, data: history });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};

exports.getReport = async (req, res) => {
  try {
    const groupBy = req.query.groupBy === "weekly" ? "weekly" : "daily";
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;

    const report = await emotionService.getReport(req.user.id, {
      groupBy,
      from,
      to,
    });

    res.status(200).json({ status: "success", data: report });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};
