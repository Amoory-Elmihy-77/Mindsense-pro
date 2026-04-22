const axios = require("axios");
const FormData = require("form-data");

const AI_BASE_URL = process.env.AI_BASE_URL || "http://localhost:8000";

// ================= FACE =================
exports.detectFace = async (fileBuffer) => {
  const form = new FormData();
  form.append("file", fileBuffer, "image.jpg");

  const res = await axios.post(`${AI_BASE_URL}/analyze-face`, form, {
    headers: form.getHeaders(),
  });

  return res.data;
};

// ================= VOICE =================
exports.detectVoice = async (filePayload) => {
  const form = new FormData();
  const buffer = filePayload?.buffer || filePayload;
  const filename = filePayload?.originalname || "audio.wav";
  const contentType = filePayload?.mimetype;

  if (contentType) {
    form.append("file", buffer, { filename, contentType });
  } else {
    form.append("file", buffer, filename);
  }

  const res = await axios.post(`${AI_BASE_URL}/analyze-voice`, form, {
    headers: form.getHeaders(),
  });

  return res.data;
};

// ================= FACE + VOICE (FUSION) =================
exports.detectAll = async (facePayload, voicePayload) => {
  const form = new FormData();

  const faceBuffer = facePayload?.buffer || facePayload;
  const faceFilename = facePayload?.originalname || "image.jpg";
  const faceContentType = facePayload?.mimetype;

  const voiceBuffer = voicePayload?.buffer || voicePayload;
  const voiceFilename = voicePayload?.originalname || "audio.wav";
  const voiceContentType = voicePayload?.mimetype;

  if (faceContentType) {
    form.append("face", faceBuffer, {
      filename: faceFilename,
      contentType: faceContentType,
    });
  } else {
    form.append("face", faceBuffer, faceFilename);
  }

  if (voiceContentType) {
    form.append("voice", voiceBuffer, {
      filename: voiceFilename,
      contentType: voiceContentType,
    });
  } else {
    form.append("voice", voiceBuffer, voiceFilename);
  }

  const res = await axios.post(`${AI_BASE_URL}/analyze-all`, form, {
    headers: form.getHeaders(),
  });

  return res.data;
};

// ================= INTERVENTION =================
exports.getIntervention = async (state) => {
  const res = await axios.post(`${AI_BASE_URL}/get-advice`, {
    state,
  });

  return res.data;
};
