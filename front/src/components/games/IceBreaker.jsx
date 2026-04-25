import React, { useState, useRef, useEffect } from 'react';

const CRACKS_NEEDED = { easy: 20, medium: 35, hard: 55 };
const BREATH_PHASES = [
  { label: 'Inhale', duration: 4, color: '#8b5cf6' },
  { label: 'Hold',   duration: 4, color: '#ec4899' },
  { label: 'Exhale', duration: 4, color: '#06b6d4' },
  { label: 'Rest',   duration: 2, color: '#10b981' },
];

export default function IceBreaker({ spec, onComplete }) {
  const cracksNeeded = CRACKS_NEEDED[spec.difficulty] || 35;
  const [cracks, setCracks] = useState([]);
  const [phase, setPhase] = useState('shatter'); // 'shatter' | 'breathe' | 'done'
  const [breathIdx, setBreathIdx] = useState(0);
  const [breathTimer, setBreathTimer] = useState(BREATH_PHASES[0].duration);
  const [breathCycles, setBreathCycles] = useState(0);
  const [started, setStarted] = useState(false);
  const [score, setScore] = useState(0);
  const containerRef = useRef(null);

  const progress = Math.min(1, cracks.length / cracksNeeded);
  const shattered = progress >= 1;

  const handleClick = (e) => {
    if (phase !== 'shatter' || shattered || !started) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const crack = {
      id: Date.now() + Math.random(),
      x, y,
      angle: Math.random() * 360,
      len: Math.random() * 30 + 15,
      opacity: Math.random() * 0.5 + 0.5,
    };
    setCracks((prev) => {
      const next = [...prev, crack];
      if (next.length >= cracksNeeded) {
        setPhase('breathe');
        setScore(spec._meta.points_base + next.length * 2);
      }
      return next;
    });
  };

  // Breathing phase timer
  useEffect(() => {
    if (phase !== 'breathe') return;
    if (breathCycles >= 3) {
      setPhase('done');
      onComplete({ score, xp_earned: spec._meta.xp_earned });
      return;
    }
    if (breathTimer <= 0) {
      const nextIdx = (breathIdx + 1) % BREATH_PHASES.length;
      if (nextIdx === 0) setBreathCycles((c) => c + 1);
      setBreathIdx(nextIdx);
      setBreathTimer(BREATH_PHASES[nextIdx].duration);
      return;
    }
    const t = setTimeout(() => setBreathTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, breathTimer, breathIdx, breathCycles, score, spec, onComplete]);

  const currentBreath = BREATH_PHASES[breathIdx];
  const circleScale = currentBreath.label === 'Inhale' ? 1.45 : currentBreath.label === 'Exhale' ? 0.65 : 1.1;

  return (
    <div className="icebreaker-game">
      {!started && (
        <div className="game-start-screen">
          <div style={{ fontSize: '3rem' }}>🧊</div>
          <h3>Ice Breaker</h3>
          <p>Release your tension — click to shatter the ice, then breathe it out.</p>
          <button className="btn btn-primary" onClick={() => setStarted(true)}>Shatter It</button>
        </div>
      )}

      {started && phase === 'shatter' && (
        <div className="shatter-phase">
          <div className="shatter-progress-bar">
            <div className="shatter-fill" style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="shatter-hint">Click anywhere to crack the ice — {cracksNeeded - cracks.length} hits left</p>
          <div
            ref={containerRef}
            className="ice-block"
            onClick={handleClick}
            style={{ filter: `brightness(${1 + progress * 0.5}) saturate(${1 + progress})` }}
          >
            {/* Crack SVG lines */}
            <svg className="crack-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
              {cracks.map((c) => {
                const rad = (c.angle * Math.PI) / 180;
                const x2 = c.x + Math.cos(rad) * (c.len / 2);
                const y2 = c.y + Math.sin(rad) * (c.len / 2);
                const x3 = c.x - Math.cos(rad) * (c.len / 3);
                const y3 = c.y - Math.sin(rad) * (c.len / 3);
                return (
                  <g key={c.id} opacity={c.opacity}>
                    <line x1={c.x} y1={c.y} x2={x2} y2={y2} stroke="white" strokeWidth="0.6" />
                    <line x1={c.x} y1={c.y} x2={x3} y2={y3} stroke="rgba(200,220,255,0.7)" strokeWidth="0.4" />
                  </g>
                );
              })}
            </svg>
            <div className="ice-center-text">
              {cracks.length === 0 ? '💢 Click to release' : cracks.length < cracksNeeded / 2 ? '😤 Keep going...' : '💥 Almost there!'}
            </div>
          </div>
        </div>
      )}

      {started && phase === 'breathe' && (
        <div className="breathe-phase">
          <h3 style={{ color: currentBreath.color }}>Great — now breathe it out</h3>
          <div
            className="breath-circle"
            style={{
              transform: `scale(${circleScale})`,
              borderColor: currentBreath.color,
              boxShadow: `0 0 60px ${currentBreath.color}55`,
              background: `radial-gradient(circle, ${currentBreath.color}33 0%, transparent 70%)`,
            }}
          >
            <div className="breath-inner" style={{ color: currentBreath.color }}>
              <span className="phase-label">{currentBreath.label}</span>
              <span className="phase-timer">{breathTimer}s</span>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
            Cycle {breathCycles + 1} of 3
          </p>
        </div>
      )}

      {phase === 'done' && (
        <div className="game-complete">
          <div className="complete-icon">❄️</div>
          <h3>Tension Released!</h3>
          <p>You shattered the ice and completed 3 breath cycles</p>
          <div className="score-display">
            <span className="score-value">+{score} pts</span>
            <span className="xp-value">+{spec._meta.xp_earned} XP</span>
          </div>
        </div>
      )}
    </div>
  );
}
