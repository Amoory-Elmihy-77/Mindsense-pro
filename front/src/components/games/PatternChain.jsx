import React, { useState, useEffect, useCallback, useRef } from 'react';

const COLOR_CONFIG = {
  easy:   { colors: ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981'], maxLen: 6,  showMs: 700, gapMs: 250 },
  medium: { colors: ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f97316', '#f59e0b'], maxLen: 9,  showMs: 550, gapMs: 200 },
  hard:   { colors: ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f97316', '#f59e0b'], maxLen: 12, showMs: 400, gapMs: 150 },
};

export default function PatternChain({ spec, onComplete }) {
  const cfg = COLOR_CONFIG[spec.difficulty] || COLOR_CONFIG.medium;
  const [sequence, setSequence] = useState([]);
  const [userSeq, setUserSeq] = useState([]);
  const [phase, setPhase] = useState('idle'); // idle | showing | input | correct | wrong | done
  const [activeIdx, setActiveIdx] = useState(-1);
  const [round, setRound] = useState(1);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const timeouts = useRef([]);

  const clearTimeouts = () => { timeouts.current.forEach(clearTimeout); timeouts.current = []; };

  const showSequence = useCallback((seq) => {
    setPhase('showing');
    setUserSeq([]);
    setActiveIdx(-1);
    let delay = 400;
    seq.forEach((colorIdx, i) => {
      timeouts.current.push(setTimeout(() => setActiveIdx(colorIdx), delay));
      delay += cfg.showMs;
      timeouts.current.push(setTimeout(() => setActiveIdx(-1), delay));
      delay += cfg.gapMs;
    });
    timeouts.current.push(setTimeout(() => { setPhase('input'); setActiveIdx(-1); }, delay));
  }, [cfg]);

  const startRound = useCallback((seq, roundNum) => {
    const newColor = Math.floor(Math.random() * cfg.colors.length);
    const newSeq = [...seq, newColor];
    setSequence(newSeq);
    setRound(roundNum);
    setTimeout(() => showSequence(newSeq), 500);
  }, [cfg.colors.length, showSequence]);

  const initGame = () => {
    clearTimeouts();
    setSequence([]); setUserSeq([]); setLives(3);
    setScore(0); setPhase('idle'); setActiveIdx(-1);
    setStarted(true);
    const firstColor = Math.floor(Math.random() * cfg.colors.length);
    const firstSeq = [firstColor];
    setSequence(firstSeq);
    setRound(1);
    setTimeout(() => showSequence(firstSeq), 600);
  };

  const handlePad = useCallback((colorIdx) => {
    if (phase !== 'input') return;
    const newUserSeq = [...userSeq, colorIdx];
    setUserSeq(newUserSeq);
    setActiveIdx(colorIdx);
    setTimeout(() => setActiveIdx(-1), 150);

    const pos = newUserSeq.length - 1;
    if (newUserSeq[pos] !== sequence[pos]) {
      // Wrong
      setPhase('wrong');
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setTimeout(() => { setPhase('done'); onComplete({ score, xp_earned: spec._meta.xp_earned }); }, 900);
      } else {
        setTimeout(() => showSequence(sequence), 1000);
      }
      return;
    }

    if (newUserSeq.length === sequence.length) {
      // Correct full sequence
      const gained = sequence.length * 20 + round * 5;
      setScore((s) => s + gained);
      setPhase('correct');
      if (sequence.length >= cfg.maxLen) {
        setTimeout(() => { setPhase('done'); onComplete({ score: score + gained, xp_earned: spec._meta.xp_earned }); }, 800);
      } else {
        setTimeout(() => startRound(sequence, round + 1), 900);
      }
    }
  }, [phase, userSeq, sequence, lives, round, score, cfg.maxLen, spec, onComplete, showSequence, startRound]);

  return (
    <div className="pattern-game">
      {!started && (
        <div className="game-start-screen">
          <div style={{ fontSize: '3rem' }}>🧠</div>
          <h3>Pattern Chain</h3>
          <p>Watch the color sequence, then repeat it back. Each round adds one more step!</p>
          <button className="btn btn-primary" onClick={initGame}>Start Pattern</button>
        </div>
      )}

      {started && phase !== 'done' && (
        <div className="pattern-active">
          <div className="pattern-hud">
            <span className="hud-stat">🔗 Round {round}</span>
            <span className="hud-stat score-live">🏆 {score}</span>
            <span className="hud-stat">{'❤️'.repeat(lives)}{'🖤'.repeat(3 - lives)}</span>
          </div>

          <div className="pattern-status">
            {phase === 'showing' && <span className="status-pill showing">👀 Watch the sequence...</span>}
            {phase === 'input'   && <span className="status-pill input">🎮 Your turn! ({userSeq.length}/{sequence.length})</span>}
            {phase === 'correct' && <span className="status-pill correct">✅ Correct! Next round...</span>}
            {phase === 'wrong'   && <span className="status-pill wrong">❌ Wrong! Watch again... ({lives} ❤️ left)</span>}
          </div>

          <div className="pattern-pads">
            {cfg.colors.map((color, idx) => (
              <button
                key={idx}
                className={`pattern-pad ${activeIdx === idx ? 'lit' : ''}`}
                style={{
                  background: activeIdx === idx ? color : `${color}33`,
                  borderColor: color,
                  boxShadow: activeIdx === idx ? `0 0 30px ${color}, 0 0 60px ${color}55` : 'none',
                }}
                onClick={() => handlePad(idx)}
                disabled={phase !== 'input'}
              />
            ))}
          </div>

          <div className="pattern-progress">
            {sequence.map((_, i) => (
              <div key={i} className={`progress-dot ${i < userSeq.length ? 'filled' : ''}`}
                style={{ background: i < userSeq.length ? cfg.colors[sequence[i]] : undefined }} />
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="game-complete">
          <div className="complete-icon">🧠</div>
          <h3>Pattern Complete!</h3>
          <p>Reached round {round} with a sequence of {sequence.length} steps</p>
          <div className="score-display">
            <span className="score-value">+{score} pts</span>
            <span className="xp-value">+{spec._meta.xp_earned} XP</span>
          </div>
        </div>
      )}
    </div>
  );
}
