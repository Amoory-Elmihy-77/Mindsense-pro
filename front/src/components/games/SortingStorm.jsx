import React, { useState, useEffect, useCallback } from 'react';

const CATEGORIES = {
  easy: [
    { label: 'Calm 😌', emoji: ['🌊', '🌿', '☁️', '🕊️', '🌙'] },
    { label: 'Happy 😊', emoji: ['🌈', '🎉', '☀️', '🌸', '🎵'] },
  ],
  medium: [
    { label: 'Calm 😌',   emoji: ['🌊', '🌿', '☁️', '🕊️', '🌙', '🍃'] },
    { label: 'Energetic ⚡', emoji: ['🔥', '⚡', '🏃', '💪', '🎯', '🚀'] },
    { label: 'Happy 😊',  emoji: ['🌈', '🎉', '☀️', '🌸', '🎵', '🦋'] },
  ],
  hard: [
    { label: 'Calm 😌',   emoji: ['🌊', '🌿', '☁️', '🕊️', '🌙', '🍃', '🧘'] },
    { label: 'Energetic ⚡', emoji: ['🔥', '⚡', '🏃', '💪', '🎯', '🚀', '⚽'] },
    { label: 'Happy 😊',  emoji: ['🌈', '🎉', '☀️', '🌸', '🎵', '🦋', '🌺'] },
    { label: 'Tricky 🤔', emoji: ['🍕', '🎭', '🔑', '🎪', '🌀', '🧩', '🎲'] },
  ],
};

function buildItemQueue(categories, count) {
  const pool = categories.flatMap((cat) => cat.emoji.map((e) => ({ emoji: e, category: cat.label })));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return Array.from({ length: count }, (_, i) => shuffled[i % shuffled.length]);
}

const QUEUE_SIZES = { easy: 12, medium: 20, hard: 30 };
const TIMERS = { easy: 60, medium: 50, hard: 40 };

export default function SortingStorm({ spec, onComplete }) {
  const diff = spec.difficulty || 'medium';
  const cats = CATEGORIES[diff];
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [timer, setTimer] = useState(TIMERS[diff]);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const initGame = () => {
    const items = buildItemQueue(cats, QUEUE_SIZES[diff]);
    setQueue(items.slice(1));
    setCurrent(items[0]);
    setCorrect(0); setWrong(0);
    setTimer(TIMERS[diff]);
    setFinished(false); setStarted(true);
  };

  useEffect(() => {
    if (!started || finished) return;
    if (timer <= 0 || (!current && queue.length === 0)) {
      const score = correct * 15 - wrong * 10;
      setFinished(true);
      onComplete({ score: Math.max(0, score), xp_earned: spec._meta.xp_earned });
      return;
    }
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [started, finished, timer, queue.length, current, correct, wrong, spec, onComplete]);

  const handleSort = useCallback((catLabel) => {
    if (!current || finished) return;
    const isCorrect = current.category === catLabel;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setCorrect((c) => c + 1); else setWrong((w) => w + 1);
    setTimeout(() => {
      setFeedback(null);
      setQueue((q) => { setCurrent(q[0] || null); return q.slice(1); });
    }, 300);
  }, [current, finished]);

  return (
    <div className="sorting-game">
      {!started && (
        <div className="game-start-screen">
          <div style={{ fontSize: '3rem' }}>🌀</div>
          <h3>Sorting Storm</h3>
          <p>Sort each emoji into the correct category as fast as you can!</p>
          <button className="btn btn-primary" onClick={initGame}>Start Storm</button>
        </div>
      )}
      {started && !finished && (
        <div className="sorting-active">
          <div className="sorting-hud">
            <span className="hud-stat">⏱ {timer}s</span>
            <span className="hud-stat text-success">✅ {correct}</span>
            <span className="hud-stat text-error">❌ {wrong}</span>
            <span className="hud-stat">📦 {queue.length} left</span>
          </div>
          <div className={`sorting-item ${feedback || ''}`}>
            <span className="sort-emoji">{current?.emoji}</span>
          </div>
          <div className="sorting-bins">
            {cats.map((cat) => (
              <button key={cat.label} className="sort-bin" onClick={() => handleSort(cat.label)}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {finished && (
        <div className="game-complete">
          <div className="complete-icon">🌀</div>
          <h3>Storm Cleared!</h3>
          <p>{correct} correct · {wrong} wrong · {Math.round((correct / Math.max(1, correct + wrong)) * 100)}% accuracy</p>
          <div className="score-display">
            <span className="score-value">+{Math.max(0, correct * 15 - wrong * 10)} pts</span>
            <span className="xp-value">+{spec._meta.xp_earned} XP</span>
          </div>
        </div>
      )}
    </div>
  );
}
