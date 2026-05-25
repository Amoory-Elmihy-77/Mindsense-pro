const VoiceSession = require("../models/VoiceSession");
const ConversationMessage = require("../models/ConversationMessage");
const VoiceAnalytics = require("../models/VoiceAnalytics");
const voiceAiService = require("./voiceAiService");
const voiceSettingsService = require("./voiceSettingsService");
const subscriptionService = require("./subscriptionService");

async function loadVoiceSettings(userId) {
  const settings = await voiceSettingsService.getOrCreate(userId);
  return voiceSettingsService.toAiPayload(settings);
}

exports.startSession = async (userId, emotion) => {
  const { allowed, remainingMinutes, plan, usageId } = await subscriptionService.checkQuota(userId, {
    requireSessionSlot: true,
  });
  if (!allowed) {
    const err = new Error("Subscription quota exceeded.");
    err.statusCode = 402;
    throw err;
  }

  const voiceSettings = await loadVoiceSettings(userId);

  // 1. Call AI Service to start session
  const aiResponse = await voiceAiService.startCompanionSession(userId, emotion, voiceSettings);

  // 2. Create DB Session
  const session = await VoiceSession.create({
    _id: aiResponse.session_id,
    user: userId,
    status: "active",
    emotionAtStart: emotion,
    metadata: { planType: plan, minutesConsumed: 0 },
  });

  // 3. Save AI Greeting
  await ConversationMessage.create({
    session: session._id,
    user: userId,
    role: "assistant",
    content: aiResponse.response_text,
    turnIndex: 0,
  });

  await subscriptionService.consumeSession(usageId);
  await VoiceAnalytics.create({ user: userId, sessionId: session._id, event: "session_start" });

  return {
    sessionId: session._id,
    greetingAudio: aiResponse.audio_base64,
    greetingText: aiResponse.response_text,
    remainingMinutes
  };
};

exports.processMessage = async (sessionId, userId, emotion, filePayload, usage) => {
  const session = await VoiceSession.findById(sessionId);
  if (!session || session.status !== "active") {
    const err = new Error("Session is not active or not found");
    err.statusCode = 400;
    throw err;
  }

  const voiceSettings = await loadVoiceSettings(userId);

  // Call AI Service
  const aiResponse = await voiceAiService.sendMessage(sessionId, userId, emotion, filePayload, voiceSettings);
  
  // Calculate approximate duration for usage tracking
  // 1 minute = roughly 60 seconds of audio. This is a naive calculation based on buffer size,
  // typically handled more accurately. For this MVP we will add 0.5 minutes per turn as a placeholder.
  const estimatedMinutesConsumed = 0.1;

  await subscriptionService.consumeMinutes(usage.usageId, estimatedMinutesConsumed);

  // Save Messages
  await ConversationMessage.create([
    {
      session: sessionId,
      user: userId,
      role: "user",
      content: aiResponse.transcript,
      emotion: emotion,
      turnIndex: session.turnCount + 1,
    },
    {
      session: sessionId,
      user: userId,
      role: "assistant",
      content: aiResponse.response_text,
      turnIndex: session.turnCount + 2,
    }
  ]);

  session.turnCount += 2;
  session.metadata.minutesConsumed += estimatedMinutesConsumed;
  session.emotionTrajectory.push({ emotion, timestamp: Date.now() });
  await session.save();

  await VoiceAnalytics.create({ user: userId, sessionId, event: "turn", data: { emotion } });

  return {
    transcript: aiResponse.transcript,
    responseAudio: aiResponse.audio_base64,
    responseText: aiResponse.response_text,
    remainingMinutes: usage.remainingMinutes - estimatedMinutesConsumed
  };
};

exports.endSession = async (sessionId, userId) => {
  const aiResponse = await voiceAiService.endCompanionSession(sessionId);
  
  const session = await VoiceSession.findById(sessionId);
  if(session){
    session.status = "completed";
    session.endedAt = Date.now();
    session.duration = (session.endedAt - session.startedAt) / 1000;
    if (aiResponse.summary) {
        session.summary = aiResponse.summary;
    }
    await session.save();
    await VoiceAnalytics.create({ user: userId, sessionId, event: "session_end", data: { duration: session.duration } });
  }

  return aiResponse.summary;
};

exports.getHistory = async (userId, limit = 20) => {
  return await VoiceSession.find({ user: userId }).sort({ createdAt: -1 }).limit(limit);
};
