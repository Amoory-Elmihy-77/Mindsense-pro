const User = require("../models/User");

// ── GET /api/v1/gamification ─────────────────────────────────────────────────
// Returns the current user's full gamification profile (xp, level, streak, sessions).
exports.getMyGamification = async (req, res) => {
  try {
    // req.user is already populated by authMiddleware — grab gamification sub-doc
    const user = await User.findById(req.user.id).select("gamification");
    res.status(200).json({
      status: "success",
      data: { gamification: user.gamification },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// ── POST /api/v1/gamification/complete ───────────────────────────────────────
// Called after a user finishes a game. Updates XP, points, streak, and adds
// the session to the history. All streak/level logic lives here on the server
// so the client can never manipulate progress directly.
exports.completeGame = async (req, res) => {
  try {
    const {
      game_name,
      game_type,
      emotion,
      score = 0,
      xp_earned = 0,
      bonus_xp = 0,
    } = req.body;

    // Fetch only the gamification sub-document to minimise payload
    const user = await User.findById(req.user.id).select("gamification");
    const g = user.gamification || {};

    // ── XP & Points ──
    const totalXpEarned = xp_earned + bonus_xp;
    const newXp     = (g.xp     || 0) + totalXpEarned;
    const newPoints = (g.points || 0) + score;

    // ── Streak logic ──
    const today     = new Date().toISOString().split("T")[0];
    const lastDate  = g.last_played
      ? new Date(g.last_played).toISOString().split("T")[0]
      : null;
    const yesterday = new Date(Date.now() - 86_400_000)
      .toISOString()
      .split("T")[0];

    let newStreak = g.streak_days || 0;
    if (lastDate === today) {
      // Already played today — streak unchanged
    } else if (lastDate === yesterday) {
      newStreak += 1;
    } else if (!lastDate) {
      newStreak = 1; // First ever game
    } else {
      newStreak = 1; // Streak broken
    }

    // ── Build session record ──
    const now = new Date();
    const session = {
      game_name:  game_name  || "Unknown",
      game_type:  game_type  || "unknown",
      emotion:    emotion    || "neutral",
      score:      score,
      xp_earned:  totalXpEarned,
      date:       now,
    };

    // Keep newest 50 sessions
    const updatedSessions = [session, ...(g.past_sessions || [])].slice(0, 50);

    const updatedGamification = {
      xp:           newXp,
      points:       newPoints,
      streak_days:  newStreak,
      last_played:  now,
      past_sessions: updatedSessions,
    };

    // Atomic update — avoids re-running password validators
    await User.findByIdAndUpdate(
      req.user.id,
      { $set: { gamification: updatedGamification } },
      { new: true }
    );

    res.status(200).json({
      status: "success",
      data: { gamification: updatedGamification },
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};

// ── DELETE /api/v1/gamification/reset ────────────────────────────────────────
// Wipes the user's gamification progress entirely (user-initiated action).
exports.resetProgress = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $set: {
        gamification: {
          xp:           0,
          points:       0,
          streak_days:  0,
          last_played:  null,
          past_sessions: [],
        },
      },
    });

    res.status(200).json({
      status: "success",
      message: "Gamification progress has been reset.",
    });
  } catch (err) {
    res.status(500).json({ status: "fail", message: err.message });
  }
};
