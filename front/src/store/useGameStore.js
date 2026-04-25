import { create } from 'zustand';

// ─── XP thresholds ───────────────────────────────────────────────────────────
// Level N requires N² × 100 XP total
export const xpForLevel = (level) => level * level * 100;

export const computeLevel = (totalXp) => {
  let level = 1;
  while (totalXp >= xpForLevel(level + 1)) level++;
  return level;
};

// ─── localStorage helpers ────────────────────────────────────────────────────
const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

// ─── Store ────────────────────────────────────────────────────────────────────
const useGameStore = create((set, get) => ({
  xp: load('ms_xp', 0),
  points: load('ms_points', 0),
  streak_days: load('ms_streak', 0),
  last_played: load('ms_last_played', null),         // ISO string | null
  past_sessions: load('ms_sessions', []),             // [{ game_name, emotion, score, xp_earned, date }]
  notifications: [],                                  // ephemeral — not persisted

  // ── Derived ──────────────────────────────────────────────────────────────
  get level() {
    return computeLevel(get().xp);
  },
  get xpToNextLevel() {
    return xpForLevel(computeLevel(get().xp) + 1);
  },
  get xpProgress() {
    const lvl = computeLevel(get().xp);
    const current = get().xp - xpForLevel(lvl);
    const needed = xpForLevel(lvl + 1) - xpForLevel(lvl);
    return (current / needed) * 100;
  },

  // ── Actions ───────────────────────────────────────────────────────────────
  completeGame: ({ game_name, emotion, score, xp_earned, bonus_xp = 0 }) => {
    const state = get();
    const totalXpEarned = xp_earned + bonus_xp;
    const newXp = state.xp + totalXpEarned;
    const newPoints = state.points + score;
    const oldLevel = computeLevel(state.xp);
    const newLevel = computeLevel(newXp);
    const today = new Date().toISOString().split('T')[0];

    // ── Streak logic ──
    let newStreak = state.streak_days;
    const lastDate = state.last_played ? state.last_played.split('T')[0] : null;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (lastDate === today) {
      // Already played today — no streak change
    } else if (lastDate === yesterday) {
      newStreak += 1;
    } else if (!lastDate) {
      newStreak = 1;
    } else {
      // Streak broken
      newStreak = 1;
    }

    const now = new Date().toISOString();
    const session = { game_name, emotion, score, xp_earned: totalXpEarned, date: now };
    const newSessions = [session, ...state.past_sessions].slice(0, 50);

    save('ms_xp', newXp);
    save('ms_points', newPoints);
    save('ms_streak', newStreak);
    save('ms_last_played', now);
    save('ms_sessions', newSessions);

    const notifs = [...state.notifications];

    // Level-up notification
    if (newLevel > oldLevel) {
      notifs.push({
        id: Date.now() + 1,
        type: 'level_up',
        message: `⬆️ Level Up! You're now Level ${newLevel}!`,
        timestamp: Date.now(),
      });
    }

    // Streak milestone notifications
    const milestones = [3, 7, 14, 30];
    if (newStreak !== state.streak_days && milestones.includes(newStreak)) {
      notifs.push({
        id: Date.now() + 2,
        type: 'streak',
        message: `🔥 ${newStreak}-Day Streak! You're on fire!`,
        timestamp: Date.now(),
      });
    } else if (newStreak !== state.streak_days && newStreak > 1) {
      notifs.push({
        id: Date.now() + 3,
        type: 'streak',
        message: `🔥 Day ${newStreak} streak — keep it going!`,
        timestamp: Date.now(),
      });
    }

    set({
      xp: newXp,
      points: newPoints,
      streak_days: newStreak,
      last_played: now,
      past_sessions: newSessions,
      notifications: notifs,
    });
  },

  checkInactivity: () => {
    const { last_played, notifications } = get();
    if (!last_played) return;
    const diffMs = Date.now() - new Date(last_played).getTime();
    const diffHours = diffMs / 3600000;
    if (diffHours > 24) {
      const alreadyHasReminder = notifications.some((n) => n.type === 'inactivity');
      if (!alreadyHasReminder) {
        set((s) => ({
          notifications: [
            ...s.notifications,
            {
              id: Date.now(),
              type: 'inactivity',
              message: `💭 Hey, it's been a while. A short game can shift your mood!`,
              timestamp: Date.now(),
            },
          ],
        }));
      }
    }
  },

  addNotification: (notification) => {
    set((s) => ({
      notifications: [...s.notifications, { id: Date.now(), timestamp: Date.now(), ...notification }],
    }));
  },

  dismissNotification: (id) => {
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
  },

  resetProgress: () => {
    ['ms_xp', 'ms_points', 'ms_streak', 'ms_last_played', 'ms_sessions'].forEach((k) =>
      localStorage.removeItem(k)
    );
    set({ xp: 0, points: 0, streak_days: 0, last_played: null, past_sessions: [], notifications: [] });
  },
}));

export default useGameStore;
