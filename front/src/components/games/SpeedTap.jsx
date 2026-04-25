import React, { useState, useEffect, useCallback } from 'react';

const CONFIG = {
  easy:   { duration: 30, fadeMs: 1200, maxTargets: 3, misses: 7 },
  medium: { duration: 30, fadeMs: 900,  maxTargets: 5, misses: 5 },
  hard:   { duration: 30, fadeMs: 600,  maxTargets: 8, misses: 4 },
};

let _id = 0;
function makeTarget(fadeMs) {
  return {
    id: _id++,
    x: Math.random() * 78 + 5,
    y: Math.random() * 78 + 5,
    born: Date.now(),
    fadeMs,
    hit: false,
  };
}

export default function SpeedTap({ spec, onComplete }) {
  const cfg = CONFIG[spec.difficulty] || CONFIG.medium;
  const [targets, setTargets] = useState([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [misses, setMisses] = useState(0);
  const [timer, setTimer] = useState(cfg.duration);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  // Spawn targets periodically
  useEffect(() => {
    if (!started || finished) return;
    const spawn = setInterval(() => {
      setTargets((prev) => {
        if (prev.filter((t) => !t.hit).length >= cfg.maxTargets) return prev;
        return [...prev, makeTarget(cfg.fadeMs)];
      });
    }, cfg.fadeMs * 0.7);
    return () => clearInterval(spawn);
  }, [started, finished, cfg]);

  // Expire targets
  useEffect(() => {
    if (!started || finished) return;
    const check = setInterval(() => {
      const now = Date.now();
      setTargets((prev) => {
        const expired = prev.filter((t) => !t.hit && now - t.born > t.fadeMs);
        if (expired.length > 0) {
          setMisses((m) => {
            const newMisses = m + expired.length;
            if (newMisses >= cfg.misses) {
              setFinished(true);
              onComplete({ score, xp_earned: spec._meta.xp_earned });
            }
            return newMisses;
          });
          setCombo(0);
          return prev.filter((t) => t.hit || now - t.born <= t.fadeMs);
        }
        return prev;
      });
    }, 100);
    return () => clearInterval(check);
  }, [started, finished, cfg, score, spec, onComplete]);

  // Timer
  useEffect(() => {
    if (!started || finished) return;
    if (timer <= 0) { setFinished(true); onComplete({ score, xp_earned: spec._meta.xp_earned }); return; }
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [started, finished, timer, score, spec, onComplete]);

  const handleHit = useCallback((id) => {
    setTargets((prev) => prev.map((t) => t.id === id ? { ...t, hit: true } : t));
    setTimeout(() => setTargets((prev) => prev.filter((t) => t.id !== id)), 200);
    setCombo((c) => c + 1);
    setScore((s) => s + 10 * (combo >= 5 ? 2 : 1));
  }, [combo]);

  return (
    <div className="speedtap-game">
      {!started && (
        <div className="game-start-screen">
          <div style={{ fontSize: '3rem' }}>⚡</div>
          <h3>Speed Tap</h3>
          <p>Tap the glowing targets before they vanish! Build combos for double points.</p>
          <button className="btn btn-primary" onClick={() => setStarted(true)}>Let's Go!</button>
        </div>
      )}
      {started && !finished && (
        <div className="speedtap-arena">
          <div className="speedtap-hud">
            <span className="hud-stat">⏱ {timer}s</span>
            <span className="hud-stat score-live">🎯 {score}</span>
            {combo >= 3 && <span className="hud-stat combo">🔥 {combo}x COMBO</span>}
            <span className="hud-stat text-error">💔 {cfg.misses - misses} left</span>
          </div>
          <div className="speedtap-field">
            {targets.filter((t) => !t.hit).map((t) => {
              const age = (Date.now() - t.born) / t.fadeMs;
              return (
                <div
                  key={t.id}
                  className="tap-target"
                  style={{ left: `${t.x}%`, top: `${t.y}%`, opacity: 1 - age * 0.6 }}
                  onClick={() => handleHit(t.id)}
                />
              );
            })}
          </div>
        </div>
      )}
      {finished && (
        <div className="game-complete">
          <div className="complete-icon">⚡</div>
          <h3>Round Over!</h3>
          <p>You scored {score} points with best combo ×{combo}</p>
          <div className="score-display">
            <span className="score-value">+{score} pts</span>
            <span className="xp-value">+{spec._meta.xp_earned} XP</span>
          </div>
        </div>
      )}
    </div>
  );
}
