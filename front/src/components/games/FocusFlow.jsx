import React, { useState, useEffect, useCallback } from 'react';

const COLOR_PAIRS = [
  { word: 'RED',    color: '#ef4444' },
  { word: 'BLUE',   color: '#3b82f6' },
  { word: 'GREEN',  color: '#10b981' },
  { word: 'PURPLE', color: '#8b5cf6' },
  { word: 'PINK',   color: '#ec4899' },
  { word: 'ORANGE', color: '#f97316' },
  { word: 'CYAN',   color: '#06b6d4' },
  { word: 'GOLD',   color: '#f59e0b' },
];

const ROUNDS = { easy: 8, medium: 14, hard: 20 };
const TIMERS  = { easy: 5, medium: 4,  hard: 3 };

function generateQuestion(pool, prevWord) {
  const word = pool[Math.floor(Math.random() * pool.length)];
  let inkColor = pool[Math.floor(Math.random() * pool.length)];
  // Guarantee mismatch ~70% of the time for challenge
  while (inkColor.word === word.word && Math.random() < 0.7) {
    inkColor = pool[Math.floor(Math.random() * pool.length)];
  }
  // Build answer options: correct ink + 3 distractors
  const correct = inkColor;
  const distractors = pool.filter((c) => c.word !== inkColor.word).sort(() => Math.random() - 0.5).slice(0, 3);
  const options = [correct, ...distractors].sort(() => Math.random() - 0.5);
  return { displayWord: word.word, inkColor, options };
}

export default function FocusFlow({ spec, onComplete }) {
  const diff = spec.difficulty || 'medium';
  const totalRounds = ROUNDS[diff];
  const questionTime = TIMERS[diff];
  const [question, setQuestion] = useState(null);
  const [round, setRound] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(questionTime);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const nextQuestion = useCallback(() => {
    setQuestion(generateQuestion(COLOR_PAIRS));
    setTimer(questionTime);
    setFeedback(null);
  }, [questionTime]);

  const initGame = () => {
    setRound(0); setCorrect(0); setStreak(0); setScore(0);
    setFinished(false);
    setStarted(true);
    setQuestion(generateQuestion(COLOR_PAIRS));
    setTimer(questionTime);
    setFeedback(null);
  };

  // Question timer
  useEffect(() => {
    if (!started || finished || feedback) return;
    if (timer <= 0) {
      // Timed out = wrong
      setStreak(0);
      setFeedback('wrong');
      const nextRound = round + 1;
      setRound(nextRound);
      if (nextRound >= totalRounds) {
        setTimeout(() => { setFinished(true); onComplete({ score, xp_earned: spec._meta.xp_earned }); }, 600);
      } else {
        setTimeout(nextQuestion, 600);
      }
      return;
    }
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [started, finished, timer, feedback, round, totalRounds, score, spec, onComplete, nextQuestion]);

  const handleAnswer = (option) => {
    if (feedback || !question || finished) return;
    const isCorrect = option.word === question.inkColor.word;
    const newStreak = isCorrect ? streak + 1 : 0;
    setStreak(newStreak);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      const gained = 20 + (newStreak >= 5 ? 20 : 0) + timer * 3;
      setScore((s) => s + gained);
      setCorrect((c) => c + 1);
    }
    const nextRound = round + 1;
    setRound(nextRound);
    if (nextRound >= totalRounds) {
      setTimeout(() => { setFinished(true); onComplete({ score: score + (isCorrect ? 20 + timer * 3 : 0), xp_earned: spec._meta.xp_earned }); }, 700);
    } else {
      setTimeout(nextQuestion, 700);
    }
  };

  return (
    <div className="focus-game">
      {!started && (
        <div className="game-start-screen">
          <div style={{ fontSize: '3rem' }}>🎨</div>
          <h3>Focus Flow</h3>
          <p>Pick the <strong>ink color</strong> of the word — not what the word says! Train your focus.</p>
          <button className="btn btn-primary" onClick={initGame}>Train Focus</button>
        </div>
      )}

      {started && !finished && question && (
        <div className="focus-active">
          <div className="focus-hud">
            <span className="hud-stat">📝 {round}/{totalRounds}</span>
            <span className="hud-stat score-live">🏆 {score}</span>
            {streak >= 3 && <span className="hud-stat combo">🔥 {streak}x streak!</span>}
            <span className={`hud-stat timer-urgent ${timer <= 1 ? 'urgent' : ''}`}>⏱ {timer}s</span>
          </div>

          <div className={`stroop-word ${feedback || ''}`} style={{ color: question.inkColor.color }}>
            {question.displayWord}
          </div>
          <p className="stroop-hint">What color is the <strong>ink</strong>?</p>

          <div className="stroop-options">
            {question.options.map((opt) => (
              <button
                key={opt.word}
                className="stroop-btn"
                style={{ '--opt-color': opt.color }}
                onClick={() => handleAnswer(opt)}
              >
                <span className="color-dot" style={{ background: opt.color }} />
                {opt.word}
              </button>
            ))}
          </div>
        </div>
      )}

      {finished && (
        <div className="game-complete">
          <div className="complete-icon">🎨</div>
          <h3>Focus Flow Complete!</h3>
          <p>{correct}/{totalRounds} correct · {Math.round((correct / totalRounds) * 100)}% accuracy</p>
          <div className="score-display">
            <span className="score-value">+{score} pts</span>
            <span className="xp-value">+{spec._meta.xp_earned} XP</span>
          </div>
        </div>
      )}
    </div>
  );
}
