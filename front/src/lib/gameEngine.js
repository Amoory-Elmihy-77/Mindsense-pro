/**
 * MindSense Pro — AI Game Engine
 * Generates personalized, replayable mini-game specs based on emotional state.
 */

// ─── Game Catalog ─────────────────────────────────────────────────────────────
// Each entry has one or more game_type keys that map to their component.
const GAME_CATALOG = [
  {
    game_type: 'breathing',
    game_name: 'Cloud Breathing',
    tags: ['sad-low', 'anxious-low', 'anxious-medium', 'neutral-low'],
    goal: 'Follow the breathing rhythm to calm your nervous system.',
    base_rules: [
      'Inhale as the circle expands',
      'Hold when the circle pauses',
      'Exhale as the circle shrinks',
      'Complete as many cycles as you can',
    ],
    difficulty_options: ['easy', 'medium', 'hard'],
    estimated_minutes: [2, 4, 6],
    xp_base: 40,
    points_base: 100,
  },
  {
    game_type: 'memory',
    game_name: 'Memory Match',
    tags: ['sad-medium', 'neutral-medium', 'happy-low'],
    goal: 'Find all matching pairs before time runs out.',
    base_rules: [
      'Flip two cards per turn',
      'Matched pairs stay face-up',
      'Complete the board to win',
      'Fewer flips = higher score',
    ],
    difficulty_options: ['easy', 'medium', 'hard'],
    estimated_minutes: [2, 3, 5],
    xp_base: 50,
    points_base: 150,
  },
  {
    game_type: 'balloon',
    game_name: 'Balloon Pop',
    tags: ['anxious-medium', 'anxious-high', 'angry-medium'],
    goal: 'Pop as many balloons as you can before they escape.',
    base_rules: [
      'Click or tap a balloon to pop it',
      'Red balloons are worth double points',
      'Black balloons subtract points — avoid them!',
      'Survive the full timer to collect bonus XP',
    ],
    difficulty_options: ['easy', 'medium', 'hard'],
    estimated_minutes: [1, 2, 3],
    xp_base: 45,
    points_base: 120,
  },
  {
    game_type: 'sorting',
    game_name: 'Sorting Storm',
    tags: ['anxious-high', 'neutral-high', 'happy-high'],
    goal: 'Sort the falling items into the correct category bins.',
    base_rules: [
      'Items fall from the top of the screen',
      'Drag or click to place them in the correct bin',
      'Speed increases every 10 seconds',
      'Three misses and the round ends',
    ],
    difficulty_options: ['easy', 'medium', 'hard'],
    estimated_minutes: [2, 3, 5],
    xp_base: 55,
    points_base: 160,
  },
  {
    game_type: 'speedtap',
    game_name: 'Speed Tap',
    tags: ['happy-high', 'happy-medium', 'neutral-high'],
    goal: 'Tap the glowing targets as fast as possible.',
    base_rules: [
      'Targets appear at random positions',
      'Tap/click them before they fade out',
      'Combo multiplier rewards consecutive hits',
      'Miss 5 targets to end the round',
    ],
    difficulty_options: ['easy', 'medium', 'hard'],
    estimated_minutes: [1, 2, 3],
    xp_base: 60,
    points_base: 200,
  },
  {
    game_type: 'word',
    game_name: 'Word Builder',
    tags: ['happy-medium', 'sad-medium', 'neutral-medium'],
    goal: 'Unscramble the positive-psychology word before time runs out.',
    base_rules: [
      'Letters are scrambled on screen',
      'Click letters in the correct order',
      'Hints cost 20 points each',
      'Faster solves earn bonus XP',
    ],
    difficulty_options: ['easy', 'medium', 'hard'],
    estimated_minutes: [2, 3, 5],
    xp_base: 50,
    points_base: 130,
  },
  {
    game_type: 'icebreaker',
    game_name: 'Ice Breaker',
    tags: ['angry-low', 'angry-medium', 'angry-high'],
    goal: 'Release your tension by shattering the ice — then breathe.',
    base_rules: [
      'Click anywhere on the ice to crack it',
      'More clicks = more cracks',
      'A breathing prompt appears once the ice shatters',
      'Complete the breathing phase to earn full XP',
    ],
    difficulty_options: ['easy', 'medium', 'hard'],
    estimated_minutes: [2, 3, 4],
    xp_base: 45,
    points_base: 110,
  },
  {
    game_type: 'focus',
    game_name: 'Focus Flow',
    tags: ['neutral-medium', 'sad-high', 'anxious-medium'],
    goal: 'Name the ink color, not the word — train your focus.',
    base_rules: [
      'A color word is displayed in a different ink color',
      'Click the button matching the INK color, not the text',
      'Speed and accuracy both count',
      'Streak of 5 correct = bonus multiplier',
    ],
    difficulty_options: ['easy', 'medium', 'hard'],
    estimated_minutes: [2, 3, 4],
    xp_base: 55,
    points_base: 140,
  },
  {
    game_type: 'pattern',
    game_name: 'Pattern Chain',
    tags: ['happy-high', 'neutral-high', 'happy-medium'],
    goal: 'Remember and repeat the growing sequence of colors.',
    base_rules: [
      'Watch the sequence light up',
      'Repeat it back in the correct order',
      'Each round adds one step to the chain',
      'Three mistakes end the game',
    ],
    difficulty_options: ['easy', 'medium', 'hard'],
    estimated_minutes: [2, 4, 6],
    xp_base: 60,
    points_base: 175,
  },
];

// ─── Emotion × Energy → Tag Priority List ────────────────────────────────────
const EMOTION_ENERGY_TAGS = {
  'sad-low':      ['sad-low', 'anxious-low', 'neutral-low'],
  'sad-medium':   ['sad-medium', 'happy-low', 'neutral-medium'],
  'sad-high':     ['sad-high', 'neutral-high', 'happy-medium'],
  'anxious-low':  ['anxious-low', 'sad-low', 'neutral-low'],
  'anxious-medium':['anxious-medium', 'neutral-medium', 'sad-medium'],
  'anxious-high': ['anxious-high', 'neutral-high', 'happy-high'],
  'happy-low':    ['happy-low', 'neutral-medium', 'sad-medium'],
  'happy-medium': ['happy-medium', 'neutral-medium', 'happy-high'],
  'happy-high':   ['happy-high', 'neutral-high', 'happy-medium'],
  'angry-low':    ['angry-low', 'angry-medium', 'anxious-low'],
  'angry-medium': ['angry-medium', 'angry-low', 'anxious-medium'],
  'angry-high':   ['angry-high', 'angry-medium', 'anxious-high'],
  'neutral-low':  ['neutral-low', 'sad-low', 'anxious-low'],
  'neutral-medium':['neutral-medium', 'sad-medium', 'happy-medium'],
  'neutral-high': ['neutral-high', 'happy-high', 'anxious-high'],
};

// ─── Difficulty by behavior ───────────────────────────────────────────────────
const BEHAVIOR_DIFFICULTY = {
  focused:    { weights: [0.2, 0.5, 0.3] },  // easy / medium / hard
  distracted: { weights: [0.5, 0.4, 0.1] },
};

// ─── Random helpers ───────────────────────────────────────────────────────────
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function weightedPick(options, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < options.length; i++) {
    r -= weights[i];
    if (r <= 0) return options[i];
  }
  return options[options.length - 1];
}

// ─── Streak bonus ─────────────────────────────────────────────────────────────
const streakBonus = (streak_days) => {
  if (streak_days >= 30) return { multiplier: 2.0, label: '🏆 Legendary (×2.0)' };
  if (streak_days >= 14) return { multiplier: 1.75, label: '⭐ Champion (×1.75)' };
  if (streak_days >= 7)  return { multiplier: 1.5,  label: '🔥 On Fire (×1.5)' };
  if (streak_days >= 3)  return { multiplier: 1.25, label: '✨ Hot Streak (×1.25)' };
  return                        { multiplier: 1.0,  label: 'Standard (×1.0)' };
};

// ─── Anti-repetition ──────────────────────────────────────────────────────────
function filterRecentGames(candidates, past_sessions, lookback = 3) {
  const recentTypes = past_sessions.slice(0, lookback).map((s) => s.game_type);
  const filtered = candidates.filter((g) => !recentTypes.includes(g.game_type));
  return filtered.length > 0 ? filtered : candidates; // fall back if all recent
}

// ─── Dynamic elements builder ─────────────────────────────────────────────────
function buildDynamicElements(game_type, difficulty) {
  const modifiers = {
    easy:   { speed: 'slow',   complexity: 'low',    timer_seconds: rand(60, 90)  },
    medium: { speed: 'normal', complexity: 'medium', timer_seconds: rand(45, 60)  },
    hard:   { speed: 'fast',   complexity: 'high',   timer_seconds: rand(30, 45)  },
  };
  const mod = modifiers[difficulty];

  const baseElements = [
    `${mod.complexity.charAt(0).toUpperCase() + mod.complexity.slice(1)} complexity layout`,
    `${mod.timer_seconds}s time limit`,
    `${mod.speed.charAt(0).toUpperCase() + mod.speed.slice(1)} game speed`,
  ];

  const extras = {
    breathing: [`${rand(4, 8)} breath cycles`, `${rand(3, 6)}s hold duration`],
    memory:    [`${difficulty === 'hard' ? 20 : difficulty === 'medium' ? 12 : 8} cards`, `${rand(2, 4)} theme variants`],
    balloon:   [`${rand(8, 20)} simultaneous balloons`, `${rand(3, 8)}% black balloons`],
    sorting:   [`${rand(3, 6)} categories`, `${rand(5, 15)}% trick items`],
    speedtap:  [`${rand(3, 10)} simultaneous targets`, `${rand(300, 1200)}ms fade time`],
    word:      [`${rand(4, 8)} letters`, `${pick(['mindfulness', 'gratitude', 'resilience', 'serenity', 'courage', 'clarity', 'empathy', 'balance'])} word pool`],
    icebreaker:[`${rand(20, 60)} cracks to shatter`, `${rand(3, 5)}-step breathing finish`],
    focus:     [`${rand(5, 12)} colors in pool`, `${rand(10, 20)} questions per round`],
    pattern:   [`Sequence grows by 1 each round`, `${rand(3, 6)} base colors`],
  };

  return [...baseElements, ...(extras[game_type] || [])];
}

// ─── Main Engine Function ─────────────────────────────────────────────────────
/**
 * @param {object} input
 * @param {string}   input.emotion       — sad | anxious | happy | angry | neutral
 * @param {string}   input.energy_level  — low | medium | high
 * @param {string}   input.user_behavior — focused | distracted
 * @param {number}   input.streak_days
 * @param {Array}    input.past_sessions — [{ game_type, game_name, ... }]
 * @returns {object} game spec
 */
export function generateGame({
  emotion = 'neutral',
  energy_level = 'medium',
  user_behavior = 'focused',
  streak_days = 0,
  past_sessions = [],
}) {
  const normalEmotion = emotion.toLowerCase();
  const tagKey = `${normalEmotion}-${energy_level}`;
  const priorityTags = EMOTION_ENERGY_TAGS[tagKey] || [`neutral-${energy_level}`];

  // Collect candidates by priority tags
  let candidates = [];
  for (const tag of priorityTags) {
    const matches = GAME_CATALOG.filter((g) => g.tags.includes(tag));
    matches.forEach((m) => {
      if (!candidates.find((c) => c.game_type === m.game_type)) candidates.push(m);
    });
    if (candidates.length >= 3) break;
  }
  if (candidates.length === 0) candidates = GAME_CATALOG;

  // Anti-repetition
  candidates = filterRecentGames(candidates, past_sessions);

  // Pick game
  const game = pick(candidates);

  // Difficulty
  const behaviorWeights = (BEHAVIOR_DIFFICULTY[user_behavior] || BEHAVIOR_DIFFICULTY.focused).weights;
  const difficulty = weightedPick(game.difficulty_options, behaviorWeights);
  const diffIdx = game.difficulty_options.indexOf(difficulty);

  // Streak bonus
  const bonus = streakBonus(streak_days);
  const xpEarned = Math.round(game.xp_base * bonus.multiplier);
  const pointsBase = game.points_base;

  // Dynamic elements (randomized)
  const dynamic_elements = buildDynamicElements(game.game_type, difficulty);

  // Estimated time
  const estimated_minutes = game.estimated_minutes[diffIdx] || game.estimated_minutes[1];

  return {
    game_type: game.game_type,
    game_name: game.game_name,
    goal: game.goal,
    rules: game.base_rules,
    dynamic_elements,
    reward_system: {
      points: `${pointsBase} base points + speed bonus`,
      xp: `${xpEarned} XP`,
      bonus: bonus.label,
    },
    difficulty,
    estimated_time: `${estimated_minutes} min`,
    // Internal metadata for the game components
    _meta: {
      xp_earned: xpEarned,
      points_base: pointsBase,
      streak_multiplier: bonus.multiplier,
      timer_seconds: parseInt(dynamic_elements.find((e) => e.includes('s time limit'))?.split('s')[0]) || 60,
      emotion: normalEmotion,
      energy_level,
    },
  };
}

export default generateGame;
