const voiceSettingsService = require("../services/voiceSettingsService");
const voiceAiService = require("../services/voiceAiService");

function getUserId(req) {
  return req.user?._id || req.user?.id;
}

exports.getSettings = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    const settings = await voiceSettingsService.getOrCreate(userId);
    res.status(200).json({
      status: "success",
      data: voiceSettingsService.toResponse(settings),
    });
  } catch (err) {
    console.error("GET voice settings error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    const settings = await voiceSettingsService.update(userId, req.body);
    res.status(200).json({
      status: "success",
      data: voiceSettingsService.toResponse(settings),
    });
  } catch (err) {
    console.error("PATCH voice settings error:", err);
    const status = err.name === "ValidationError" ? 400 : 500;
    res.status(status).json({ status: "error", message: err.message });
  }
};

exports.previewVoice = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ status: "fail", message: "Unauthorized" });
    }

    const { preferredLanguage, voiceStyle, speed } = req.body;
    const settings = await voiceSettingsService.getOrCreate(userId);
    const normalized = voiceSettingsService.toResponse(settings);

    const previewLang = preferredLanguage
      ? voiceSettingsService.toResponse({ preferredLanguage }).preferredLanguage
      : normalized.preferredLanguage;

    const preview = await voiceAiService.previewVoice({
      preferred_language: previewLang,
      voice_style: voiceStyle ?? normalized.voiceStyle,
      speed: speed ?? normalized.speed,
    });

    res.status(200).json({
      status: "success",
      data: {
        audioBase64: preview.audio_base64,
        sampleText: preview.sample_text,
      },
    });
  } catch (err) {
    console.error("Voice preview error:", err);
    res.status(err.statusCode || 500).json({ status: "error", message: err.message });
  }
};
