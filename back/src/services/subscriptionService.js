const Subscription = require("../models/Subscription");
const UsageRecord = require("../models/UsageRecord");

const PLAN_LIMITS = {
  free: { minutesPerPeriod: 30, sessionsPerPeriod: 30, period: "week" },
  plus: { minutesPerPeriod: 200, sessionsPerPeriod: 999, period: "month" },
  pro: { minutesPerPeriod: 9999, sessionsPerPeriod: 9999, period: "month" },
};

const DEV_LIMITS = { minutesPerPeriod: 9999, sessionsPerPeriod: 9999, period: "week" };

function isDevQuotaRelaxed() {
  if (process.env.VOICE_DEV_UNLIMITED === "true") return true;
  if (process.env.VOICE_DEV_UNLIMITED === "false") return false;
  return process.env.NODE_ENV !== "production";
}

function getEffectiveLimits(sub) {
  if (isDevQuotaRelaxed()) {
    return { ...DEV_LIMITS, period: sub.limits?.period || "week" };
  }
  const plan = sub.plan || "free";
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

const getPeriodString = (periodType) => {
  const date = new Date();
  if (periodType === "week") {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - startOfYear) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
    return `${date.getFullYear()}-W${weekNumber}`;
  }
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
};

exports.getOrCreateSubscription = async (userId) => {
  let sub = await Subscription.findOne({ user: userId });
  const planLimits = PLAN_LIMITS.free;

  if (!sub) {
    sub = await Subscription.create({
      user: userId,
      plan: "free",
      limits: planLimits,
    });
  }
  return sub;
};

exports.getCurrentUsage = async (userId, periodType) => {
  const period = getPeriodString(periodType);
  let usage = await UsageRecord.findOne({ user: userId, period });
  if (!usage) {
    usage = await UsageRecord.create({
      user: userId,
      period,
      periodType,
    });
  }
  return usage;
};

exports.checkQuota = async (userId, options = {}) => {
  const { requireSessionSlot = true } = options;
  const sub = await exports.getOrCreateSubscription(userId);
  const limits = getEffectiveLimits(sub);
  const usage = await exports.getCurrentUsage(userId, limits.period);

  const minutesAllowed = limits.minutesPerPeriod;
  const sessionsAllowed = limits.sessionsPerPeriod;

  const minutesOk = usage.minutesUsed < minutesAllowed;
  const sessionsOk = !requireSessionSlot || usage.sessionsUsed < sessionsAllowed;
  const allowed = minutesOk && sessionsOk;

  return {
    allowed,
    remainingMinutes: Math.max(0, minutesAllowed - usage.minutesUsed),
    remainingSessions: Math.max(0, sessionsAllowed - usage.sessionsUsed),
    minutesUsed: usage.minutesUsed,
    minutesAllowed,
    sessionsUsed: usage.sessionsUsed,
    sessionsAllowed,
    plan: sub.plan,
    usageId: usage._id,
    devMode: isDevQuotaRelaxed(),
  };
};

exports.consumeMinutes = async (usageId, minutesToConsume) => {
  await UsageRecord.findByIdAndUpdate(usageId, {
    $inc: { minutesUsed: minutesToConsume },
    lastUpdated: Date.now(),
  });
};

exports.consumeSession = async (usageId) => {
  await UsageRecord.findByIdAndUpdate(usageId, {
    $inc: { sessionsUsed: 1 },
    lastUpdated: Date.now(),
  });
};

/** Reset current-period usage (development / testing only). */
exports.resetCurrentPeriodUsage = async (userId) => {
  const sub = await exports.getOrCreateSubscription(userId);
  const limits = getEffectiveLimits(sub);
  const period = getPeriodString(limits.period);

  await UsageRecord.findOneAndUpdate(
    { user: userId, period },
    { $set: { minutesUsed: 0, sessionsUsed: 0, lastUpdated: Date.now() } },
    { upsert: true, new: true }
  );

  return exports.checkQuota(userId);
};

exports.isDevQuotaRelaxed = isDevQuotaRelaxed;
