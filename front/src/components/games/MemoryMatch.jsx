import React, { useState, useEffect, useCallback } from 'react';

const CARD_SETS = [
  ['🌸', '🌊', '🦋', '🌿', '⭐', '🌙', '🔮', '🍃', '💜', '🌈'],
  ['🦁', '🐬', '🦚', '🌺', '🍀', '🌟', '🎯', '🎨', '🎵', '🏔️'],
  ['🔥', '💎', '🌙', '🦄', '🌊', '🎋', '🍁', '🌻', '🦋', '🐉'],
];

const GRID_CONFIG = {
  easy:   { pairs: 4,  cols: 4 },
  medium: { pairs: 6,  cols: 4 },
  hard:   { pairs: 10, cols: 5 },
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MemoryMatch({ spec, onComplete }) {
  const config = GRID_CONFIG[spec.difficulty] || GRID_CONFIG.medium;
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [flips, setFlips] = useState(0);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timer, setTimer] = useState(spec._meta.timer_seconds || 90);

  const initGame = useCallback(() => {
    const emojiSet = CARD_SETS[Math.floor(Math.random() * CARD_SETS.length)];
    const selected = emojiSet.slice(0, config.pairs);
    const doubled = shuffle([...selected, ...selected].map((e, i) => ({ id: i, emoji: e })));
    setCards(doubled);
    setFlipped([]);
    setMatched([]);
    setFlips(0);
    setTimer(spec._meta.timer_seconds || 90);
    setFinished(false);
    setStarted(true);
  }, [config.pairs, spec._meta.timer_seconds]);

  // Timer countdown
  useEffect(() => {
    if (!started || finished) return;
    if (timer <= 0) {
      const score = Math.max(0, spec._meta.points_base - flips * 5);
      setFinished(true);
      onComplete({ score, xp_earned: Math.round(spec._meta.xp_earned * (matched.length / (config.pairs * 2))) });
      return;
    }
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [started, finished, timer, flips, matched.length, config.pairs, spec, onComplete]);

  const handleFlip = (card) => {
    if (finished) return;
    if (flipped.length === 2) return;
    if (flipped.find((c) => c.id === card.id)) return;
    if (matched.includes(card.emoji)) return;

    const newFlipped = [...flipped, card];
    setFlipped(newFlipped);
    setFlips((f) => f + 1);

    if (newFlipped.length === 2) {
      if (newFlipped[0].emoji === newFlipped[1].emoji) {
        const newMatched = [...matched, card.emoji];
        setMatched(newMatched);
        setFlipped([]);
        if (newMatched.length === config.pairs) {
          const score = spec._meta.points_base + Math.max(0, (timer * 2)) - flips * 3;
          setFinished(true);
          onComplete({ score: Math.max(0, score), xp_earned: spec._meta.xp_earned });
        }
      } else {
        setTimeout(() => setFlipped([]), 900);
      }
    }
  };

  const isFlipped = (card) => flipped.find((c) => c.id === card.id) || matched.includes(card.emoji);

  return (
    <div className="memory-game">
      {!started && (
        <div className="game-start-screen">
          <div className="memory-preview">🃏</div>
          <h3>Memory Match</h3>
          <p>Find all {config.pairs} matching pairs. Fewer flips = higher score!</p>
          <button className="btn btn-primary" onClick={initGame}>Start Game</button>
        </div>
      )}

      {started && !finished && (
        <div className="memory-active">
          <div className="memory-hud">
            <span className="hud-stat">⏱ {timer}s</span>
            <span className="hud-stat">🔄 {flips} flips</span>
            <span className="hud-stat">✅ {matched.length}/{config.pairs}</span>
          </div>
          <div className="memory-grid" style={{ gridTemplateColumns: `repeat(${config.cols}, 1fr)` }}>
            {cards.map((card) => (
              <div
                key={card.id}
                className={`memory-card ${isFlipped(card) ? 'flipped' : ''} ${matched.includes(card.emoji) ? 'matched' : ''}`}
                onClick={() => handleFlip(card)}
              >
                <div className="card-inner">
                  <div className="card-back">?</div>
                  <div className="card-front">{card.emoji}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {finished && (
        <div className="game-complete">
          <div className="complete-icon">{matched.length === config.pairs ? '🏆' : '⌛'}</div>
          <h3>{matched.length === config.pairs ? 'Perfect Match!' : 'Time\'s Up!'}</h3>
          <p>{matched.length}/{config.pairs} pairs found in {flips} flips</p>
          <div className="score-display">
            <span className="score-value">+{Math.max(0, spec._meta.points_base + timer * 2 - flips * 3)} pts</span>
            <span className="xp-value">+{spec._meta.xp_earned} XP</span>
          </div>
        </div>
      )}
    </div>
  );
}
