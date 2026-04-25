import React, { useEffect, useState, useCallback } from 'react';
import { generateGame } from '../lib/gameEngine';
import useGameStore, { computeLevel, xpForLevel } from '../store/useGameStore';
import useAuthStore from '../store/useAuthStore';
import useEmotionStore from '../store/useEmotionStore';
import GameNotification from '../components/GameNotification';

import BreathingGame from '../components/games/BreathingGame';
import MemoryMatch   from '../components/games/MemoryMatch';
import BalloonPop    from '../components/games/BalloonPop';
import SortingStorm  from '../components/games/SortingStorm';
import SpeedTap      from '../components/games/SpeedTap';
import WordBuilder   from '../components/games/WordBuilder';
import IceBreaker    from '../components/games/IceBreaker';
import FocusFlow     from '../components/games/FocusFlow';
import PatternChain  from '../components/games/PatternChain';

import '../styles/games.css';

const GAME_COMPONENTS = {
  breathing: BreathingGame,
  memory:    MemoryMatch,
  balloon:   BalloonPop,
  sorting:   SortingStorm,
  speedtap:  SpeedTap,
  word:      WordBuilder,
  icebreaker:IceBreaker,
  focus:     FocusFlow,
  pattern:   PatternChain,
};

const EMOTION_EMOJIS = { sad:'😢', anxious:'😰', happy:'😊', angry:'😤', neutral:'😐' };
const ENERGY_LABELS  = { low:'🔋 Low', medium:'⚡ Medium', high:'🚀 High' };
const EMOTIONS       = ['neutral','happy','sad','anxious','angry'];
const ENERGIES       = ['low','medium','high'];

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
  } catch { return ''; }
}

export default function Games() {
  const { user } = useAuthStore();
  const { emotion, energy_level, user_behavior, setEmotion } = useEmotionStore();
  const {
    xp, points, streak_days, past_sessions,
    completeGame, checkInactivity,
  } = useGameStore();

  const level    = computeLevel(xp);
  const xpNeeded = xpForLevel(level + 1);
  const xpCurrent = xp - xpForLevel(level);
  const xpRange   = xpForLevel(level + 1) - xpForLevel(level);
  const xpPct     = Math.min(100, (xpCurrent / xpRange) * 100);

  const [spec, setSpec] = useState(null);
  const [gameKey, setGameKey] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const generate = useCallback((em = emotion, en = energy_level, beh = user_behavior) => {
    const newSpec = generateGame({
      emotion: em,
      energy_level: en,
      user_behavior: beh,
      streak_days,
      past_sessions: past_sessions.map((s) => ({ game_type: s.game_type || s.game_name, game_name: s.game_name })),
    });
    setSpec(newSpec);
    setGameKey((k) => k + 1);
    setGameOver(false);
    setLastResult(null);
  }, [emotion, energy_level, user_behavior, streak_days, past_sessions]);

  // Init: check inactivity, generate first game
  useEffect(() => {
    checkInactivity();
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleComplete = useCallback(({ score, xp_earned }) => {
    setGameOver(true);
    setLastResult({ score, xp_earned });
    completeGame({
      game_name:  spec.game_name,
      game_type:  spec.game_type,
      emotion,
      score,
      xp_earned,
      bonus_xp: 0,
    });
  }, [spec, emotion, completeGame]);

  const handleEmotionChange = (em) => {
    setEmotion(em, energy_level, user_behavior);
    generate(em, energy_level, user_behavior);
  };

  const handleEnergyChange = (en) => {
    setEmotion(emotion, en, user_behavior);
    generate(emotion, en, user_behavior);
  };

  const GameComponent = spec ? GAME_COMPONENTS[spec.game_type] : null;
  const initials = user?.name ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) : 'MS';

  return (
    <div className="games-page animate-fade-in">
      <GameNotification />

      {/* ── Header ── */}
      <div className="games-header">
        <div>
          <h1>🎮 Mind Games</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
            Games auto-matched to your detected emotion &mdash; or override below
          </p>
        </div>

        {/* Emotion & energy override selectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>Override mood:</div>
          <div className="emotion-selector">
            {EMOTIONS.map((em) => (
              <button
                key={em}
                id={`emotion-${em}`}
                className={`emotion-btn ${emotion === em ? 'active' : ''}`}
                onClick={() => handleEmotionChange(em)}
              >
                {EMOTION_EMOJIS[em]} {em}
              </button>
            ))}
          </div>
          <div className="emotion-selector">
            <label>Energy:</label>
            {ENERGIES.map((en) => (
              <button
                key={en}
                id={`energy-${en}`}
                className={`emotion-btn ${energy_level === en ? 'active' : ''}`}
                onClick={() => handleEnergyChange(en)}
              >
                {ENERGY_LABELS[en]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="stats-bar glass-panel">
        <div className="player-info">
          <div className="player-avatar">{initials}</div>
          <div>
            <div className="player-name">{user?.name || 'Player'}</div>
            <div className="player-level">Level {level} Explorer</div>
          </div>
        </div>

        <div className="xp-section">
          <div className="xp-labels">
            <span>
              <span className="level-badge">LVL {level}</span>
              &nbsp; {xpCurrent} / {xpRange} XP
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>Next: LVL {level + 1}</span>
          </div>
          <div className="xp-bar-track">
            <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            Total XP: {xp.toLocaleString()}
          </div>
        </div>

        <div className="streak-badge">
          <span className="streak-flame">🔥</span>
          <span className="streak-count">{streak_days}</span>
          <span className="streak-label">Day Streak</span>
        </div>

        <div className="points-badge">
          <span style={{ fontSize: '1.1rem' }}>⭐</span>
          <span className="points-value">{points.toLocaleString()}</span>
          <span className="points-label">Total Points</span>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="games-main">

        {/* Game Canvas */}
        <div className="game-canvas-card glass-panel">
          {spec ? (
            <>
              <div className="card-header">
                <div className="game-meta">
                  <div className="game-title">{spec.game_name}</div>
                  <div className="game-tags">
                    <span className={`game-tag tag-difficulty ${spec.difficulty}`}>{spec.difficulty}</span>
                    <span className="game-tag">⏱ {spec.estimated_time}</span>
                    <span className="game-tag">{EMOTION_EMOJIS[emotion]} {emotion}</span>
                  </div>
                  <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {spec.goal}
                  </p>
                </div>
                <div className="reward-pills">
                  <span className="reward-pill pill-xp">+{spec.reward_system.xp}</span>
                  <span className="reward-pill pill-bonus">{spec.reward_system.bonus}</span>
                </div>
              </div>

              <div className="game-body">
                {GameComponent && !gameOver && (
                  <GameComponent key={gameKey} spec={spec} onComplete={handleComplete} />
                )}

                {gameOver && lastResult && (
                  <div className="game-complete">
                    <div className="complete-icon">🏆</div>
                    <h3>Game Complete!</h3>
                    <p>{spec.game_name} · {emotion} mood</p>
                    <div className="score-display">
                      <span className="score-value">+{lastResult.score} pts</span>
                      <span className="xp-value">+{lastResult.xp_earned} XP</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="game-footer">
                {gameOver && (
                  <button id="btn-next-game" className="btn btn-primary" onClick={() => generate()}>
                    Next Game →
                  </button>
                )}
                <button id="btn-new-variant" className="btn btn-secondary" onClick={() => generate()}>
                  🔄 New Variant
                </button>
              </div>
            </>
          ) : (
            <div className="game-generating">
              <div className="gen-spinner" />
              <p style={{ color: 'var(--text-secondary)' }}>Generating your game...</p>
            </div>
          )}
        </div>

        {/* Session History */}
        <div className="history-card glass-panel">
          <h3>📋 Recent Sessions</h3>
          {past_sessions.length === 0 ? (
            <div className="no-sessions">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎮</div>
              <p>Play your first game to start building history!</p>
            </div>
          ) : (
            <div className="session-list">
              {past_sessions.slice(0, 8).map((s, i) => (
                <div key={i} className="session-item">
                  <span className="session-emoji">
                    {EMOTION_EMOJIS[s.emotion] || '🎮'}
                  </span>
                  <div className="session-info">
                    <div className="session-name">{s.game_name}</div>
                    <div className="session-date">{formatDate(s.date)}</div>
                    <span className="emotion-chip">{s.emotion || 'neutral'}</span>
                  </div>
                  <div className="session-rewards">
                    <span className="session-score">+{s.score} pts</span>
                    <span className="session-xp">+{s.xp_earned} XP</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dynamic elements info */}
          {spec && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Current Game Config
              </div>
              {spec.dynamic_elements.map((el, i) => (
                <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', padding: '0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ color: '#8b5cf6' }}>▸</span> {el}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
