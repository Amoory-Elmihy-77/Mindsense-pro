import React, { useState, useEffect, useRef, useCallback } from 'react';

const PHASES = ['inhale', 'hold', 'exhale', 'rest'];

const PHASE_CONFIG = {
  easy:   { inhale: 4, hold: 2, exhale: 6, rest: 2, cycles: 5 },
  medium: { inhale: 5, hold: 3, exhale: 7, rest: 2, cycles: 7 },
  hard:   { inhale: 6, hold: 4, exhale: 8, rest: 2, cycles: 10 },
};

const PHASE_LABELS = {
  inhale: 'Inhale',
  hold:   'Hold',
  exhale: 'Exhale',
  rest:   'Rest',
};

const PHASE_COLORS = {
  inhale: '#8b5cf6',
  hold:   '#ec4899',
  exhale: '#06b6d4',
  rest:   '#10b981',
};

export default function BreathingGame({ spec, onComplete }) {
  const config = PHASE_CONFIG[spec.difficulty] || PHASE_CONFIG.medium;
  const [phase, setPhase] = useState(PHASES[0]);
  const [phaseTime, setPhaseTime] = useState(config[PHASES[0]]);
  const [cycleCount, setCycleCount] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const phaseIdx = useRef(0);
  const timerRef = useRef(null);

  const advancePhase = useCallback(() => {
    phaseIdx.current = (phaseIdx.current + 1) % PHASES.length;
    const nextPhase = PHASES[phaseIdx.current];
    setPhase(nextPhase);
    setPhaseTime(config[nextPhase]);

    if (nextPhase === 'inhale') {
      setCycleCount((c) => {
        const next = c + 1;
        if (next >= config.cycles) {
          setTimeout(() => {
            setFinished(true);
            const finalScore = spec._meta.points_base + next * 10;
            setScore(finalScore);
            onComplete({ score: finalScore, xp_earned: spec._meta.xp_earned });
          }, config[nextPhase] * 1000);
        }
        return next;
      });
    }
  }, [config, spec, onComplete]);

  useEffect(() => {
    if (!started || finished) return;
    timerRef.current = setInterval(() => {
      setPhaseTime((t) => {
        if (t <= 1) {
          advancePhase();
          return config[PHASES[(phaseIdx.current + 1) % PHASES.length]];
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started, finished, advancePhase, config]);

  const circleScale = phase === 'inhale' ? 1.5 : phase === 'exhale' ? 0.7 : 1.1;
  const color = PHASE_COLORS[phase];

  return (
    <div className="breathing-game">
      {!started && !finished && (
        <div className="game-start-screen">
          <div className="breath-circle-idle" />
          <h3>Cloud Breathing</h3>
          <p>Follow the circle to calm your mind. Complete {config.cycles} breath cycles.</p>
          <button className="btn btn-primary" onClick={() => setStarted(true)}>
            Begin Breathing
          </button>
        </div>
      )}

      {started && !finished && (
        <div className="breathing-active">
          <div className="breath-meta">
            <span className="cycle-count">Cycle {cycleCount + 1} / {config.cycles}</span>
          </div>
          <div className="breath-arena">
            <div
              className="breath-circle"
              style={{
                transform: `scale(${circleScale})`,
                background: `radial-gradient(circle, ${color}55 0%, ${color}22 60%, transparent 100%)`,
                boxShadow: `0 0 60px ${color}44`,
                borderColor: color,
              }}
            >
              <div className="breath-inner" style={{ color }}>
                <span className="phase-label">{PHASE_LABELS[phase]}</span>
                <span className="phase-timer">{phaseTime}s</span>
              </div>
            </div>
          </div>
          <p className="breath-hint" style={{ color }}>
            {phase === 'inhale' && 'Breathe in slowly through your nose...'}
            {phase === 'hold'   && 'Hold gently...'}
            {phase === 'exhale' && 'Release slowly through your mouth...'}
            {phase === 'rest'   && 'Rest and relax...'}
          </p>
        </div>
      )}

      {finished && (
        <div className="game-complete">
          <div className="complete-icon">🌬️</div>
          <h3>Well done!</h3>
          <p>You completed {config.cycles} breath cycles</p>
          <div className="score-display">
            <span className="score-value">+{score} pts</span>
            <span className="xp-value">+{spec._meta.xp_earned} XP</span>
          </div>
        </div>
      )}
    </div>
  );
}
