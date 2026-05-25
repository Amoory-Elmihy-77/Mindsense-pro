const axios = require("axios");
const FormData = require("form-data");

const AI_BASE_URL = process.env.AI_BASE_URL || "http://localhost:8000";

function appendVoiceSettings(form, voiceSettings = {}) {
  if (!voiceSettings || Object.keys(voiceSettings).length === 0) return;
  form.append("voice_settings", JSON.stringify(voiceSettings));
}

exports.startCompanionSession = async (userId, emotionContext = "Neutral", voiceSettings = {}) => {
  const form = new FormData();
  form.append("user_id", userId.toString());
  form.append("emotion", emotionContext);
  appendVoiceSettings(form, voiceSettings);

  const res = await axios.post(`${AI_BASE_URL}/companion/session/start`, form, {
    headers: form.getHeaders(),
  });
  return res.data;
};

exports.sendMessage = async (sessionId, userId, emotionContext, filePayload, voiceSettings = {}) => {
  const form = new FormData();
  form.append("session_id", sessionId.toString());
  form.append("user_id", userId.toString());
  form.append("emotion", emotionContext);
  appendVoiceSettings(form, voiceSettings);

  const buffer = filePayload?.buffer || filePayload;
  const filename = filePayload?.originalname || "audio.webm";
  const contentType = filePayload?.mimetype || "audio/webm";

  form.append("audio", buffer, { filename, contentType });

  const res = await axios.post(`${AI_BASE_URL}/companion/session/message`, form, {
    headers: form.getHeaders(),
  });
  return res.data;
};

exports.endCompanionSession = async (sessionId) => {
  const form = new FormData();
  form.append("session_id", sessionId.toString());

  const res = await axios.post(`${AI_BASE_URL}/companion/session/end`, form, {
    headers: form.getHeaders(),
  });
  return res.data;
};

exports.previewVoice = async (voiceSettings) => {
  const form = new FormData();
  form.append("voice_settings", JSON.stringify(voiceSettings));

  const res = await axios.post(`${AI_BASE_URL}/companion/tts/preview`, form, {
    headers: form.getHeaders(),
  });
  return res.data;
};
