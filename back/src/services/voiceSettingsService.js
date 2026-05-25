const mongoose = require("mongoose");
const VoiceSettings = require("../models/VoiceSettings");

const DEFAULTS = {
  preferredLanguage: "egyptian_arabic",
  autoDetect: false,
  voiceStyle: "warm",
  speed: 100,
};

function normalizeLanguage(value) {
  if (value === "arabic" || value === "egyptian") return "egyptian_arabic";
  if (value === "english") return "english";
  return DEFAULTS.preferredLanguage;
}

function toResponse(settings) {
  const doc = settings?.toObject ? settings.toObject() : settings || {};
  return {
    preferredLanguage: normalizeLanguage(doc.preferredLanguage),
    autoDetect: doc.autoDetect === true,
    voiceStyle: doc.voiceStyle === "calm" ? "calm" : "warm",
    speed: Math.min(120, Math.max(80, Number(doc.speed) || DEFAULTS.speed)),
  };
}

exports.getOrCreate = async (userId) => {
  const userRef = new mongoose.Types.ObjectId(userId);

  let settings = await VoiceSettings.findOne({ user: userRef });
  if (!settings) {
    try {
      settings = await VoiceSettings.create({ user: userRef, ...DEFAULTS });
    } catch (err) {
      if (err.code === 11000) {
        settings = await VoiceSettings.findOne({ user: userRef });
      } else {
        throw err;
      }
    }
  }

  const normalized = toResponse(settings);
  const needsPersist =
    settings.preferredLanguage !== normalized.preferredLanguage ||
    settings.speed !== normalized.speed;

  if (needsPersist) {
    settings.preferredLanguage = normalized.preferredLanguage;
    settings.speed = normalized.speed;
    await settings.save();
  }

  return settings;
};

exports.update = async (userId, updates) => {
  const allowed = ["preferredLanguage", "autoDetect", "voiceStyle", "speed"];
  const payload = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      payload[key] = updates[key];
    }
  }

  if (payload.preferredLanguage) {
    payload.preferredLanguage = normalizeLanguage(payload.preferredLanguage);
    payload.autoDetect = false;
  }

  if (Object.keys(payload).length === 0) {
    return exports.getOrCreate(userId);
  }

  const userRef = new mongoose.Types.ObjectId(userId);
  const settings = await VoiceSettings.findOneAndUpdate(
    { user: userRef },
    { $set: payload },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return settings;
};

exports.toResponse = toResponse;

exports.toAiPayload = (settings) => {
  const normalized = toResponse(settings);
  return {
    preferred_language: normalized.preferredLanguage,
    auto_detect: normalized.autoDetect,
    voice_style: normalized.voiceStyle,
    speed: normalized.speed,
  };
};
