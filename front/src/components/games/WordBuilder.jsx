import React, { useState, useCallback, useEffect } from 'react';

const WORD_POOLS = {
  easy: [
    'calm', 'hope', 'kind', 'grow', 'rest', 'safe', 'free', 'love', 'joy', 'care',
  ],
  medium: [
    'mindful', 'balance', 'courage', 'clarity', 'empathy', 'serene', 'breathe', 'healing',
  ],
  hard: [
    'resilience', 'gratitude', 'compassion', 'awareness', 'wellbeing', 'confidence',
  ],
};

const TIMERS = { easy: 90, medium: 70, hard: 55 };

function scramble(word) {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  // Make sure it's always scrambled
  return arr.join('') === word ? scramble(word) : arr.join('');
}

export default function WordBuilder({ spec, onComplete }) {
  const diff = spec.difficulty || 'medium';
  const pool = WORD_POOLS[diff];
  const [wordIndex, setWordIndex] = useState(0);
  const [word, setWord] = useState('');
  const [letters, setLetters] = useState([]);
  const [selected, setSelected] = useState([]);
  const [timer, setTimer] = useState(TIMERS[diff]);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [hints, setHints] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [wordsCompleted, setWordsCompleted] = useState(0);

  const loadWord = useCallback((idx) => {
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
    const w = shuffledPool[idx % shuffledPool.length];
    setWord(w);
    setLetters(
      scramble(w).split('').map((ch, i) => ({ id: i, char: ch, used: false }))
    );
    setSelected([]);
  }, [pool]);

  const initGame = () => {
    setScore(0); setHints(0); setWordsCompleted(0);
    setTimer(TIMERS[diff]);
    setWordIndex(0);
    setFinished(false);
    setFeedback(null);
    setStarted(true);
    loadWord(0);
  };

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

  const handleLetterClick = (letter) => {
    if (letter.used || finished) return;
    const newSelected = [...selected, letter];
    setLetters((prev) => prev.map((l) => l.id === letter.id ? { ...l, used: true } : l));
    setSelected(newSelected);

    const attempt = newSelected.map((l) => l.char).join('');
    if (attempt.length === word.length) {
      if (attempt === word) {
        const timeBonus = timer * 2;
        const hintPenalty = hints * 20;
        const gained = Math.max(0, spec._meta.points_base / pool.length + timeBonus - hintPenalty);
        setScore((s) => s + gained);
        setWordsCompleted((c) => c + 1);
        setFeedback('correct');
        setTimeout(() => {
          setFeedback(null);
          const nextIdx = wordIndex + 1;
          if (nextIdx >= pool.length) {
            setFinished(true);
            onComplete({ score: score + gained, xp_earned: spec._meta.xp_earned });
          } else {
            setWordIndex(nextIdx);
            loadWord(nextIdx);
          }
        }, 800);
      } else {
        setFeedback('wrong');
        setTimeout(() => {
          setFeedback(null);
          setLetters((prev) => prev.map((l) => ({ ...l, used: false })));
          setSelected([]);
        }, 600);
      }
    }
  };

  const useHint = () => {
    if (finished) return;
    setHints((h) => h + 1);
    // Reveal the next correct letter position
    const correctOrder = word.split('');
    const filledCount = selected.length;
    if (filledCount < correctOrder.length) {
      const nextChar = correctOrder[filledCount];
      const availableLetter = letters.find((l) => !l.used && l.char === nextChar);
      if (availableLetter) handleLetterClick(availableLetter);
    }
  };

  return (
    <div className="word-game">
      {!started && (
        <div className="game-start-screen">
          <div style={{ fontSize: '3rem' }}>🔤</div>
          <h3>Word Builder</h3>
          <p>Unscramble positive psychology words! Build mental strength one word at a time.</p>
          <button className="btn btn-primary" onClick={initGame}>Start Building</button>
        </div>
      )}

      {started && !finished && (
        <div className="word-active">
          <div className="word-hud">
            <span className="hud-stat">⏱ {timer}s</span>
            <span className="hud-stat">📝 {wordsCompleted}/{pool.length}</span>
            <span className="hud-stat score-live">🏆 {Math.round(score)}</span>
          </div>

          <div className={`word-answer ${feedback || ''}`}>
            {word.split('').map((_, i) => (
              <div key={i} className="answer-slot">
                {selected[i]?.char || ''}
              </div>
            ))}
          </div>

          <div className="word-letters">
            {letters.map((l) => (
              <button
                key={l.id}
                className={`letter-btn ${l.used ? 'used' : ''}`}
                onClick={() => handleLetterClick(l)}
                disabled={l.used}
              >
                {l.char.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="word-actions">
            <button className="btn btn-secondary" onClick={useHint}>💡 Hint (−20pts)</button>
            <button className="btn btn-secondary" onClick={() => {
              setLetters((prev) => prev.map((l) => ({ ...l, used: false })));
              setSelected([]);
            }}>↩ Reset</button>
          </div>
        </div>
      )}

      {finished && (
        <div className="game-complete">
          <div className="complete-icon">🔤</div>
          <h3>Words Mastered!</h3>
          <p>{wordsCompleted} words built · {hints} hints used</p>
          <div className="score-display">
            <span className="score-value">+{Math.round(score)} pts</span>
            <span className="xp-value">+{spec._meta.xp_earned} XP</span>
          </div>
        </div>
      )}
    </div>
  );
}
