import { create } from 'zustand';
import api from '../lib/axios';

// ─── XP thresholds ────────────────────────────────────────────────────────────
// Level 1 starts at 0 XP. Level N requires (N-1)² × 100 XP total
export const xpForLevel = (level) => (level - 1) * (level - 1) * 100;

export const computeLevel = (totalXp) => {
  let level = 1;
  while (totalXp >= xpForLevel(level + 1)) level++;
  return level;
};

// ─── localStorage cache helpers ───────────────────────────────────────────────
// Used as an offline / instant-load cache only. MongoDB is the source of truth.
const cacheKey = (userId, key) => `ms_${key}_${userId}`;

const loadCache = (userId, key, fallback) => {
  if (!userId) return fallback;
  try {
    const raw = localStorage.getItem(cacheKey(userId, key));
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const saveCache = (userId, key, value) => {
  if (!userId) return;
  localStorage.setItem(cacheKey(userId, key), JSON.stringify(value));
};

const clearCache = (userId) => {
  if (!userId) return;
  ['xp', 'points', 'streak', 'last_played', 'sessions'].forEach((k) =>
    localStorage.removeItem(cacheKey(userId, k))
  );
};

// ─── Helper: write a gamification snapshot to the cache ──────────────────────
const persistToCache = (userId, g) => {
  saveCache(userId, 'xp',          g.xp          ?? 0);
  saveCache(userId, 'points',      g.points       ?? 0);
  saveCache(userId, 'streak',      g.streak_days  ?? 0);
  saveCache(userId, 'last_played', g.last_played  ?? null);
  saveCache(userId, 'sessions',    g.past_sessions ?? []);
};

// ─── Helper: apply a gamification snapshot to Zustand state ──────────────────
const applySnapshot = (g) => ({
  xp:           g.xp           ?? 0,
  points:       g.points        ?? 0,
  streak_days:  g.streak_days   ?? 0,
  last_played:  g.last_played   ?? null,
  past_sessions: g.past_sessions ?? [],
});

// ─── Store ────────────────────────────────────────────────────────────────────
const useGameStore = create((set, get) => ({
  currentUserId: null,
  isLoading:     false,

  // Progress fields (zeroed until initForUser is called)
  xp:            0,
  points:        0,
  streak_days:   0,
  last_played:   null,
  past_sessions: [],
  notifications: [], // ephemeral — never persisted

  // ── Derived getters ───────────────────────────────────────────────────────
  get level() {
    return computeLevel(get().xp);
  },
  get xpToNextLevel() {
    return xpForLevel(computeLevel(get().xp) + 1);
  },
  get xpProgress() {
    const lvl     = computeLevel(get().xp);
    const current = get().xp - xpForLevel(lvl);
    const needed  = xpForLevel(lvl + 1) - xpForLevel(lvl);
    return (current / needed) * 100;
  },

  // ── initForUser ───────────────────────────────────────────────────────────
  // Call this right after the authenticated user is resolved (e.g. after getMe).
  // 1. Instantly hydrates from localStorage cache for zero-flicker UX.
  // 2. Fetches fresh data from the backend and reconciles.
  initForUser: async (userId) => {
    if (!userId) return;
    if (get().currentUserId === userId) return; // already loaded

    // Step 1 — instant paint from cache
    set({
      currentUserId: userId,
      isLoading:     true,
      notifications: [],
      xp:            loadCache(userId, 'xp',          0),
      points:        loadCache(userId, 'points',       0),
      streak_days:   loadCache(userId, 'streak',       0),
      last_played:   loadCache(userId, 'last_played',  null),
      past_sessions: loadCache(userId, 'sessions',     []),
    });

    // Step 2 — authoritative data from MongoDB
    try {
      const res = await api.get('/v1/gamification');
      const g   = res.data.data.gamification || {};
      set({ ...applySnapshot(g), isLoading: false });
      persistToCache(userId, g);
    } catch {
      // Backend unreachable — keep showing the cached values
      set({ isLoading: false });
    }
  },

  // ── clearSession ──────────────────────────────────────────────────────────
  // Call on logout. Wipes in-memory state; localStorage cache stays intact
  // so the next login is instant.
  clearSession: () => {
    set({
      currentUserId: null,
      isLoading:     false,
      xp:            0,
      points:        0,
      streak_days:   0,
      last_played:   null,
      past_sessions: [],
      notifications: [],
    });
  },

  // ── completeGame ──────────────────────────────────────────────────────────
  // Optimistically updates local state immediately, then syncs to MongoDB.
  // If the backend is down the optimistic update is kept and will be
  // overwritten on the next successful fetch.
  completeGame: async ({ game_name, game_type, emotion, score, xp_earned, bonus_xp = 0 }) => {
    const state = get();
    const uid   = state.currentUserId;

    // ── Optimistic calculation ──
    const totalXpEarned = xp_earned + bonus_xp;
    const newXp     = state.xp + totalXpEarned;
    const newPoints = state.points + score;
    const oldLevel  = computeLevel(state.xp);
    const newLevel  = computeLevel(newXp);
    const today     = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
    const lastDate  = state.last_played
      ? new Date(state.last_played).toISOString().split('T')[0]
      : null;

    let newStreak = state.streak_days;
    if (lastDate === today) {
      // no change
    } else if (lastDate === yesterday) {
      newStreak += 1;
    } else if (!lastDate) {
      newStreak = 1;
    } else {
      newStreak = 1; // streak broken
    }

    const now        = new Date().toISOString();
    const session    = { game_name, game_type, emotion, score, xp_earned: totalXpEarned, date: now };
    const newSessions = [session, ...state.past_sessions].slice(0, 50);

    // Build notifications
    const notifs = [...state.notifications];
    if (newLevel > oldLevel) {
      notifs.push({
        id: Date.now() + 1, type: 'level_up',
        message: `⬆️ Level Up! You're now Level ${newLevel}!`,
        timestamp: Date.now(),
      });
    }
    const milestones = [3, 7, 14, 30];
    if (newStreak !== state.streak_days && milestones.includes(newStreak)) {
      notifs.push({
        id: Date.now() + 2, type: 'streak',
        message: `🔥 ${newStreak}-Day Streak! You're on fire!`,
        timestamp: Date.now(),
      });
    } else if (newStreak !== state.streak_days && newStreak > 1) {
      notifs.push({
        id: Date.now() + 3, type: 'streak',
        message: `🔥 Day ${newStreak} streak — keep it going!`,
        timestamp: Date.now(),
      });
    }

    // Apply optimistic update + cache
    const optimistic = {
      xp: newXp, points: newPoints, streak_days: newStreak,
      last_played: now, past_sessions: newSessions,
    };
    set({ ...optimistic, notifications: notifs });
    persistToCache(uid, { ...optimistic, streak_days: newStreak });

    // ── Sync to MongoDB ──
    try {
      const res = await api.post('/v1/gamification/complete', {
        game_name, game_type, emotion, score, xp_earned, bonus_xp,
      });
      const g = res.data.data.gamification || {};
      // Reconcile with server truth (streak / XP recalculated server-side)
      set(applySnapshot(g));
      persistToCache(uid, g);
    } catch {
      // Network error — optimistic values remain; will sync on next visit
    }
  },

  // ── checkInactivity ───────────────────────────────────────────────────────
  checkInactivity: () => {
    const { last_played, notifications } = get();
    if (!last_played) return;
    const diffHours = (Date.now() - new Date(last_played).getTime()) / 3_600_000;
    if (diffHours > 24 && !notifications.some((n) => n.type === 'inactivity')) {
      set((s) => ({
        notifications: [
          ...s.notifications,
          {
            id: Date.now(), type: 'inactivity',
            message: `💭 Hey, it's been a while. A short game can shift your mood!`,
            timestamp: Date.now(),
          },
        ],
      }));
    }
  },

  addNotification: (notification) => {
    set((s) => ({
      notifications: [
        ...s.notifications,
        { id: Date.now(), timestamp: Date.now(), ...notification },
      ],
    }));
  },

  dismissNotification: (id) => {
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
  },

  // ── resetProgress ─────────────────────────────────────────────────────────
  // Wipes progress in MongoDB AND the local cache.
  resetProgress: async () => {
    const uid = get().currentUserId;
    try {
      await api.delete('/v1/gamification/reset');
    } catch { /* ignore network errors */ }
    clearCache(uid);
    set({
      xp: 0, points: 0, streak_days: 0,
      last_played: null, past_sessions: [], notifications: [],
    });
  },
}));

export default useGameStore;
