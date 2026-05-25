const subscriptionService = require("../services/subscriptionService");

/**
 * @param {{ requireSessionSlot?: boolean }} options
 * - requireSessionSlot: true for session/start (counts weekly session limit)
 * - requireSessionSlot: false for session/message (only minutes; session already started)
 */
exports.checkQuota = (options = {}) => {
  const { requireSessionSlot = true } = options;

  return async (req, res, next) => {
    try {
      const quota = await subscriptionService.checkQuota(req.user.id, { requireSessionSlot });
      if (!quota.allowed) {
        const minutesExceeded = quota.minutesUsed >= quota.minutesAllowed;
        const sessionsExceeded =
          requireSessionSlot && quota.sessionsUsed >= quota.sessionsAllowed;

        let message = "Subscription quota exceeded. Please upgrade your plan.";
        if (minutesExceeded) {
          message = "Voice minutes quota exceeded for this period.";
        } else if (sessionsExceeded) {
          message = "Session limit reached for this period.";
        }

        if (subscriptionService.isDevQuotaRelaxed()) {
          message += " (Dev: POST /api/v1/voice/subscription/reset to clear usage.)";
        }

        return res.status(402).json({
          status: "fail",
          message,
          plan: quota.plan,
          remainingMinutes: quota.remainingMinutes,
          remainingSessions: quota.remainingSessions,
        });
      }

      req.subscription = { plan: quota.plan };
      req.usage = quota;
      next();
    } catch (err) {
      next(err);
    }
  };
};
