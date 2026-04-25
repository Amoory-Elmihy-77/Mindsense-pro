import React, { useState, useEffect, useRef, useCallback } from 'react';

const DIFFICULTY_CONFIG = {
  easy:   { duration: 60, spawnRate: 1500, maxBalloons: 6,  speedMin: 3, speedMax: 6  },
  medium: { duration: 45, spawnRate: 1000, maxBalloons: 10, speedMin: 4, speedMax: 8  },
  hard:   { duration: 30, spawnRate: 700,  maxBalloons: 15, speedMin: 6, speedMax: 12 },
};

const BALLOON_COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

function randomBalloon(id, config) {
  const isEvil = Math.random() < 0.08;
  const isBonus = !isEvil && Math.random() < 0.12;
  return {
    id,
    x: Math.random() * 80 + 5, // % from left
    y: 110, // start below viewport
    speed: Math.random() * (config.speedMax - config.speedMin) + config.speedMin,
    color: isEvil ? '#1a1a2e' : isBonus ? '#fbbf24' : BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
    size: Math.random() * 20 + 40,
    isEvil,
    isBonus,
    popped: false,
  };
}

export default function BalloonPop({ spec, onComplete }) {
  const config = DIFFICULTY_CONFIG[spec.difficulty] || DIFFICULTY_CONFIG.medium;
  const [balloons, setBalloons] = useState([]);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(config.duration);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const nextId = useRef(0);
  const frameRef = useRef(null);
  const lastSpawn = useRef(Date.now());

  const popBalloon = useCallback((balloon) => {
    if (balloon.popped || finished) return;
    setBalloons((prev) => prev.map((b) => b.id === balloon.id ? { ...b, popped: true } : b));
    setScore((s) => {
      const delta = balloon.isEvil ? -30 : balloon.isBonus ? 80 : 20;
      return Math.max(0, s + delta);
    });
    setTimeout(() => setBalloons((prev) => prev.filter((b) => b.id !== balloon.id)), 300);
  }, [finished]);

  // Game loop
  useEffect(() => {
    if (!started || finished) return;

    const loop = () => {
      const now = Date.now();

      // Move balloons
      setBalloons((prev) => {
        let updated = prev
          .map((b) => ({ ...b, y: b.y - b.speed * 0.05 }))
          .filter((b) => b.y > -20);

        // Spawn new
        if (now - lastSpawn.current > config.spawnRate && updated.length < config.maxBalloons) {
          updated = [...updated, randomBalloon(nextId.current++, config)];
          lastSpawn.current = now;
        }
        return updated;
      });

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [started, finished, config]);

  // Timer
  useEffect(() => {
    if (!started || finished) return;
    if (timer <= 0) {
      setFinished(true);
      onComplete({ score, xp_earned: spec._meta.xp_earned });
      return;
    }
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [started, finished, timer, score, spec, onComplete]);

  return (
    <div className="balloon-game">
      {!started && (
        <div className="game-start-screen">
          <div style={{ fontSize: '4rem' }}>🎈</div>
          <h3>Balloon Pop</h3>
          <p>Pop the colorful balloons! Avoid dark ones — they cost you points.<br />
          Gold balloons are worth triple!</p>
          <button className="btn btn-primary" onClick={() => setStarted(true)}>Pop Away!</button>
        </div>
      )}

      {started && !finished && (
        <div className="balloon-arena">
          <div className="balloon-hud">
            <span className="hud-stat">⏱ {timer}s</span>
            <span className="hud-stat score-live">🎯 {score} pts</span>
          </div>
          <div className="balloon-field">
            {balloons.map((b) => (
              <div
                key={b.id}
                className={`balloon ${b.popped ? 'popped' : ''} ${b.isEvil ? 'evil' : ''} ${b.isBonus ? 'bonus' : ''}`}
                onClick={() => popBalloon(b)}
                style={{
                  left: `${b.x}%`,
                  bottom: `${b.y}%`,
                  width: b.size,
                  height: b.size * 1.2,
                  background: b.isEvil
                    ? 'radial-gradient(circle at 35% 35%, #333, #111)'
                    : `radial-gradient(circle at 35% 35%, ${b.color}dd, ${b.color}88)`,
                  boxShadow: b.isBonus ? `0 0 20px ${b.color}` : undefined,
                }}
              >
                {b.isEvil ? '💀' : b.isBonus ? '⭐' : ''}
              </div>
            ))}
          </div>
        </div>
      )}

      {finished && (
        <div className="game-complete">
          <div className="complete-icon">🎈</div>
          <h3>Time's Up!</h3>
          <p>You popped your way to {score} points!</p>
          <div className="score-display">
            <span className="score-value">+{score} pts</span>
            <span className="xp-value">+{spec._meta.xp_earned} XP</span>
          </div>
        </div>
      )}
    </div>
  );
}
