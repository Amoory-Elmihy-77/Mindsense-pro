const Emotion = require("../models/Emotion");
const User = require("../models/User");
const sendEmail = require("../utils/email");
const aiService = require("./aiService");

const getDominantFromScores = (scores) => {
  if (!scores || typeof scores !== "object") {
    return null;
  }

  const entries = Object.entries(scores).filter(([, value]) =>
    Number.isFinite(value),
  );

  if (!entries.length) {
    return null;
  }

  entries.sort((a, b) => b[1] - a[1]);
  return {
    state: entries[0][0],
    confidence: entries[0][1],
  };
};

const normalizeResult = (result, source) => {
  let state;
  let confidence = null;

  if (source === "face" && result && typeof result === "object") {
    const faceData = result.emotion;
    const faceScores = faceData?.scores || faceData;
    const dominant = getDominantFromScores(faceScores);

    if (dominant) {
      state = dominant.state;
      confidence = dominant.confidence;
      return { state, confidence };
    }
  }

  if (source === "fusion" && result && typeof result === "object") {
    const fusionState =
      result.fusion?.final_state || result.final_state || result.state;
    const fusionScores = result.fusion?.scores;
    const top = fusionState
      ? { state: fusionState, confidence: fusionScores?.[fusionState] ?? null }
      : getDominantFromScores(fusionScores);

    if (top) {
      state = top.state;
      confidence = Number.isFinite(top.confidence) ? top.confidence : null;
      return { state, confidence };
    }
  }

  if (typeof result === "string") {
    state = result;
  } else if (result && typeof result === "object") {
    state =
      result.emotion ||
      result.state ||
      result.final_emotion ||
      result.label ||
      result.prediction;

    if (typeof result.confidence === "number") {
      confidence = result.confidence;
    } else if (typeof result.score === "number") {
      confidence = result.score;
    } else if (typeof result.probability === "number") {
      confidence = result.probability;
    }
  }

  return {
    state: state || "unknown",
    confidence,
  };
};

const ensureAnalysisSucceeded = (result, source) => {
  if (result && typeof result === "object" && result.status === "error") {
    const message = result.message || `AI ${source} analysis failed`;
    const err = new Error(message);
    err.statusCode = 422;
    throw err;
  }
};

const dangerousEmotions = ['حزين', 'غاضب', 'خائف', 'مكتئب', 'sad', 'angry', 'fear', 'depressed', 'anxious', 'stress'];

const enrichAnalysisWithAdviceAndAlerts = async (userId, state) => {
  let advice = null;
  let contactNotified = false;

  try {
    const adviceRes = await aiService.getIntervention(state);
    if (adviceRes && typeof adviceRes === 'object') {
       advice = adviceRes.advice || adviceRes.message || adviceRes.recommendations || adviceRes;
    } else {
       advice = adviceRes;
    }
  } catch (err) {
    console.error("Failed to fetch advice inside service", err);
  }

  if (state && dangerousEmotions.includes(String(state).toLowerCase().trim())) {
    try {
      const user = await User.findById(userId);
      if (user && user.trustedContact && user.trustedContact.status === "accepted") {
        const message = `Hello ${user.trustedContact.name},\n\n${user.name} may be experiencing a high stress state (${state}).\nAutomated System Alert: Our continuous emotion tracker has identified they might be in a highly distressed or dangerous state. Please check in with them immediately.\n\nMindSense AI`;
        
        await sendEmail({
          email: user.trustedContact.email,
          subject: "MindSense AI alert for a trusted contact",
          message,
        });
        contactNotified = 'success';
      } else {
        contactNotified = 'failed';
      }
    } catch (err) {
      console.error("Failed to notify trusted contact inside service", err);
      contactNotified = 'failed';
    }
  }

  return { advice, contactNotified };
};

exports.detectFaceAndSave = async (userId, fileBuffer) => {
  const result = await aiService.detectFace(fileBuffer);
  ensureAnalysisSucceeded(result, "face");
  const normalized = normalizeResult(result, "face");

  const emotion = await Emotion.create({
    user: userId,
    source: "face",
    state: normalized.state,
    confidence: normalized.confidence,
    raw: result,
  });

  const enriched = await enrichAnalysisWithAdviceAndAlerts(userId, normalized.state);
  return { result, emotion, advice: enriched.advice, contactNotified: enriched.contactNotified };
};

exports.detectVoiceAndSave = async (userId, filePayload) => {
  const result = await aiService.detectVoice(filePayload);
  ensureAnalysisSucceeded(result, "voice");
  const normalized = normalizeResult(result, "voice");

  const emotion = await Emotion.create({
    user: userId,
    source: "voice",
    state: normalized.state,
    confidence: normalized.confidence,
    raw: result,
  });

  const enriched = await enrichAnalysisWithAdviceAndAlerts(userId, normalized.state);
  return { result, emotion, advice: enriched.advice, contactNotified: enriched.contactNotified };
};

exports.detectAllAndSave = async (userId, facePayload, voicePayload) => {
  const result = await aiService.detectAll(facePayload, voicePayload);
  ensureAnalysisSucceeded(result, "fusion");
  const normalized = normalizeResult(result, "fusion");

  const emotion = await Emotion.create({
    user: userId,
    source: "fusion",
    state: normalized.state,
    confidence: normalized.confidence,
    raw: result,
  });

  const enriched = await enrichAnalysisWithAdviceAndAlerts(userId, normalized.state);
  return { result, emotion, advice: enriched.advice, contactNotified: enriched.contactNotified };
};

exports.getHistory = async (userId, filters) => {
  const query = { user: userId };

  if (filters.source) {
    query.source = filters.source;
  }

  if (filters.from || filters.to) {
    query.createdAt = {};
    if (filters.from) query.createdAt.$gte = filters.from;
    if (filters.to) query.createdAt.$lte = filters.to;
  }

  return await Emotion.find(query).sort({ createdAt: -1 }).limit(filters.limit);
};

exports.getReport = async (userId, filters) => {
  const match = { user: userId };

  if (filters.from || filters.to) {
    match.createdAt = {};
    if (filters.from) match.createdAt.$gte = filters.from;
    if (filters.to) match.createdAt.$lte = filters.to;
  }

  const groupId = {
    state: "$state",
  };

  if (filters.groupBy === "weekly") {
    groupId.week = { $isoWeek: "$createdAt" };
    groupId.year = { $isoWeekYear: "$createdAt" };
  } else {
    groupId.day = {
      $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
    };
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: groupId,
        count: { $sum: 1 },
        avgConfidence: { $avg: "$confidence" },
      },
    },
    { $sort: { "_id.year": 1, "_id.week": 1, "_id.day": 1 } },
  ];

  return await Emotion.aggregate(pipeline);
};
