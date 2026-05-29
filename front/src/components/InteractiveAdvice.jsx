import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock3,
  Gamepad2,
  Info,
  Languages,
  ListChecks,
  MessageCircle,
  RotateCcw,
  Target,
  Timer,
  Wind,
} from "lucide-react";
import "../styles/interactiveAdvice.css";

const PLAYBOOKS = {
  sad: {
    label: "Gentle recovery",
    goal: "Lift the load a little",
    summary:
      "The scan suggests low mood, so this plan starts with low-pressure steps and a small connection cue.",
    steps: [
      "Name the feeling without judging it.",
      "Drink water or change your posture.",
      "Send one short check-in message to someone safe.",
    ],
    aftercare: "Choose one easy task only. Finishing small still counts.",
  },
  angry: {
    label: "Cool down",
    goal: "Reduce intensity before acting",
    summary:
      "The scan suggests high activation, so this plan creates space before you respond or decide.",
    steps: [
      "Pause for three slow exhales.",
      "Unclench your jaw, shoulders, and hands.",
      "Write the action you want to take, then wait two minutes.",
    ],
    aftercare: "Return to the issue after your body is calmer.",
  },
  anxious: {
    label: "Grounding",
    goal: "Bring attention back to now",
    summary:
      "The scan suggests anxiety, so this plan reduces uncertainty through breathing and grounding.",
    steps: [
      "Look around and name five things you can see.",
      "Breathe in for four counts and out for six.",
      "Pick the next tiny action you can complete in ten minutes.",
    ],
    aftercare: "Avoid solving the whole day at once. Solve the next ten minutes.",
  },
  happy: {
    label: "Keep momentum",
    goal: "Use positive energy well",
    summary:
      "The scan suggests a positive state, so this plan helps you protect momentum without overloading yourself.",
    steps: [
      "Write down what helped your mood today.",
      "Choose one useful task to do while energy is available.",
      "Save time for rest so the momentum lasts.",
    ],
    aftercare: "Repeat the thing that worked, but keep your pace realistic.",
  },
  neutral: {
    label: "Focus reset",
    goal: "Build steady attention",
    summary:
      "The scan suggests a stable state, so this plan supports clarity and gentle productivity.",
    steps: [
      "Clear one distraction from your space.",
      "Set a simple target for the next fifteen minutes.",
      "Take one breath before starting.",
    ],
    aftercare: "Check again after your next focused block.",
  },
};

const GOALS = [
  { id: "calm", labels: { en: "Calm", ar: "هدوء" }, icon: Wind },
  { id: "focus", labels: { en: "Focus", ar: "تركيز" }, icon: Target },
  { id: "reflect", labels: { en: "Reflect", ar: "تأمل" }, icon: MessageCircle },
];

const UI_COPY = {
  en: {
    language: "Language",
    english: "English",
    arabic: "Arabic",
    eyebrow: "Interactive recommendation",
    heading: "AI Intervention Plan",
    currentGoal: "Current goal",
    tabs: {
      plan: "Plan",
      why: "Why",
      after: "After",
    },
    stepsDone: (done, total) => `${done} of ${total} steps done`,
    whyHeading: "Why this goal helps",
    afterHeading: "After this goal",
    timerLabel: "3-minute reset",
    pause: "Pause",
    done: "Done",
    start: "Start",
    resetTimer: "Reset timer",
    playGame: "Play recommended game",
    analyzeAgain: "Analyze again",
    nextActivity: (gameName) => `Recommended next activity: ${gameName}.`,
    fallbackWhy:
      "The system detects the dominant emotion, retrieves a matching intervention from the knowledge base, and uses the AI coach to turn that context into practical guidance.",
  },
  ar: {
    language: "اللغة",
    english: "English",
    arabic: "العربية",
    eyebrow: "توصية تفاعلية",
    heading: "خطة تدخل ذكية",
    currentGoal: "الهدف الحالي",
    tabs: {
      plan: "الخطة",
      why: "السبب",
      after: "بعدها",
    },
    stepsDone: (done, total) => `${done} من ${total} خطوات مكتملة`,
    whyHeading: "لماذا يساعد هذا الهدف",
    afterHeading: "بعد هذا الهدف",
    timerLabel: "إعادة ضبط 3 دقائق",
    pause: "إيقاف مؤقت",
    done: "تم",
    start: "ابدأ",
    resetTimer: "إعادة ضبط المؤقت",
    playGame: "العب اللعبة المقترحة",
    analyzeAgain: "حلل مرة أخرى",
    nextActivity: (gameName) => `النشاط المقترح بعد ذلك: ${gameName}.`,
    fallbackWhy:
      "النظام يحدد الشعور الأقوى، يسترجع التدخل الأقرب من قاعدة المعرفة، ثم يحوله إلى خطوات عملية قصيرة.",
  },
};

const stripBullet = (line) =>
  line
    .replace(/^[-*•\d.)\s]+/, "")
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .trim();

const normalizeAdvice = (advice, emotion, goalContent) => {
  const fallback = PLAYBOOKS[emotion] || PLAYBOOKS.neutral;

  if (Array.isArray(goalContent?.plan)) {
    return goalContent.plan.map(String).filter(Boolean).slice(0, 5);
  }

  if (!advice) {
    return fallback.steps;
  }

  if (Array.isArray(advice?.items)) {
    return advice.items.map(String).filter(Boolean).slice(0, 5);
  }

  const text = typeof advice === "string" ? advice : JSON.stringify(advice);
  const lines = text
    .split(/\n+/)
    .map(stripBullet)
    .filter((line) => line.length > 8);

  if (lines.length >= 2) {
    return lines.slice(0, 5);
  }

  return [text, ...fallback.steps].filter(Boolean).slice(0, 5);
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

const getInitialLanguage = (advicePayload) => {
  if (advicePayload.default_language === "ar") return "ar";

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.language === "string" &&
    navigator.language.startsWith("ar")
  ) {
    return "ar";
  }

  return "en";
};

const InteractiveAdvice = ({
  advice,
  emotion = "neutral",
  confidence = 0,
  gameRec,
  onPlayGame,
  onAnalyzeAgain,
}) => {
  const normalizedEmotion = String(emotion || "neutral").toLowerCase();
  const playbook = PLAYBOOKS[normalizedEmotion] || PLAYBOOKS.neutral;
  const advicePayload = useMemo(
    () =>
      advice && typeof advice === "object" && !Array.isArray(advice)
        ? advice
        : {},
    [advice],
  );
  const backendGoal = String(advicePayload.recommended_goal || "").toLowerCase();
  const initialGoal = GOALS.some((goal) => goal.id === backendGoal)
    ? backendGoal
    : "calm";
  const [selectedGoal, setSelectedGoal] = useState(initialGoal);
  const [language, setLanguage] = useState(() => getInitialLanguage(advicePayload));
  const [activeView, setActiveView] = useState("plan");
  const [completed, setCompleted] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(180);
  const [timerRunning, setTimerRunning] = useState(false);

  const copy = UI_COPY[language];
  const localizedContent = useMemo(
    () => advicePayload.content?.[language] || advicePayload.content?.en || {},
    [advicePayload, language],
  );
  const selectedGoalContent = useMemo(
    () => localizedContent.goals?.[selectedGoal] || {},
    [localizedContent, selectedGoal],
  );

  const steps = useMemo(
    () => normalizeAdvice(advice, normalizedEmotion, selectedGoalContent),
    [advice, normalizedEmotion, selectedGoalContent],
  );

  useEffect(() => {
    if (!timerRunning || secondsLeft <= 0) return undefined;

    const id = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => window.clearInterval(id);
  }, [timerRunning, secondsLeft]);

  const completedCount = steps.filter((_, index) => completed[index]).length;
  const progress = steps.length
    ? Math.round((completedCount / steps.length) * 100)
    : 0;
  const selectedGoalMeta =
    GOALS.find((goal) => goal.id === selectedGoal) || GOALS[0];
  const SelectedGoalIcon = selectedGoalMeta.icon;
  const summary = localizedContent.summary || advicePayload.summary || playbook.summary;
  const title = localizedContent.title || advicePayload.title || playbook.label;
  const focusLabel =
    selectedGoalContent.label || `${selectedGoalMeta.labels[language]}: ${playbook.goal}`;
  const whyText = selectedGoalContent.why || advicePayload.why || copy.fallbackWhy;
  const aftercare =
    selectedGoalContent.after || advicePayload.aftercare || playbook.aftercare;

  const toggleStep = (index) => {
    setCompleted((current) => ({
      ...current,
      [index]: !current[index],
    }));
  };

  const changeGoal = (goalId) => {
    setSelectedGoal(goalId);
    setCompleted({});
  };

  return (
    <section
      className="interactive-advice glass-panel animate-fade-in"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <div className="interactive-advice__header">
        <div>
          <div className="interactive-advice__eyebrow">
            <ListChecks size={16} />
            {copy.eyebrow}
          </div>
          <h2>{copy.heading}</h2>
          <p>{summary}</p>
        </div>

        <div className="interactive-advice__side">
          <div className="interactive-advice__language" aria-label={copy.language}>
            <Languages size={16} />
            <button
              type="button"
              className={language === "en" ? "is-active" : ""}
              onClick={() => setLanguage("en")}
            >
              {copy.english}
            </button>
            <button
              type="button"
              className={language === "ar" ? "is-active" : ""}
              onClick={() => setLanguage("ar")}
            >
              {copy.arabic}
            </button>
          </div>

          <div className="interactive-advice__state" dir="auto">
            <span>{title}</span>
            <strong>{normalizedEmotion}</strong>
            {confidence > 0 && <small>{Math.round(confidence * 100)}% match</small>}
          </div>
        </div>
      </div>

      <div className="interactive-advice__goal-row" role="tablist" aria-label="Select intervention goal">
        {GOALS.map((goal) => {
          const GoalIcon = goal.icon;
          const active = selectedGoal === goal.id;

          return (
            <button
              key={goal.id}
              type="button"
              className={`interactive-advice__goal ${active ? "is-active" : ""}`}
              onClick={() => changeGoal(goal.id)}
              aria-pressed={active}
            >
              <GoalIcon size={17} />
              {goal.labels[language]}
            </button>
          );
        })}
      </div>

      <div className="interactive-advice__tabs" role="tablist" aria-label="Recommendation views">
        {[
          ["plan", copy.tabs.plan],
          ["why", copy.tabs.why],
          ["after", copy.tabs.after],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={activeView === id ? "is-active" : ""}
            onClick={() => setActiveView(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeView === "plan" && (
        <div className="interactive-advice__body">
          <div className="interactive-advice__focus">
            <SelectedGoalIcon size={22} />
            <div>
              <span>{copy.currentGoal}</span>
              <strong>{focusLabel}</strong>
            </div>
          </div>

          <div className="interactive-advice__progress">
            <div>
              <span>{copy.stepsDone(completedCount, steps.length)}</span>
              <strong>{progress}%</strong>
            </div>
            <div className="interactive-advice__progress-track">
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="interactive-advice__steps">
            {steps.map((step, index) => {
              const done = Boolean(completed[index]);
              const StepIcon = done ? CheckCircle2 : Circle;

              return (
                <button
                  key={`${step}-${index}`}
                  type="button"
                  className={`interactive-advice__step ${done ? "is-done" : ""}`}
                  onClick={() => toggleStep(index)}
                >
                  <StepIcon size={21} />
                  <span dir="auto">{step}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeView === "why" && (
        <div className="interactive-advice__explain">
          <Info size={22} />
          <div>
            <strong>{copy.whyHeading}</strong>
            <p>{whyText}</p>
          </div>
        </div>
      )}

      {activeView === "after" && (
        <div className="interactive-advice__explain">
          <MessageCircle size={22} />
          <div>
            <strong>{copy.afterHeading}</strong>
            <p>{aftercare}</p>
            {gameRec && <p>{copy.nextActivity(gameRec.game_name)}</p>}
          </div>
        </div>
      )}

      <div className="interactive-advice__timer">
        <div>
          <Clock3 size={20} />
          <span>{copy.timerLabel}</span>
          <strong>{formatTime(secondsLeft)}</strong>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setTimerRunning((value) => !value)}
        >
          <Timer size={17} />
          {timerRunning ? copy.pause : secondsLeft === 0 ? copy.done : copy.start}
        </button>
        <button
          type="button"
          className="btn btn-secondary interactive-advice__icon-btn"
          onClick={() => {
            setTimerRunning(false);
            setSecondsLeft(180);
          }}
          aria-label={copy.resetTimer}
        >
          <RotateCcw size={17} />
        </button>
      </div>

      <div className="interactive-advice__actions">
        {gameRec && (
          <button type="button" className="btn btn-primary" onClick={onPlayGame}>
            <Gamepad2 size={18} />
            {copy.playGame}
          </button>
        )}
        <button type="button" className="btn btn-secondary" onClick={onAnalyzeAgain}>
          <RotateCcw size={18} />
          {copy.analyzeAgain}
        </button>
      </div>
    </section>
  );
};

export default InteractiveAdvice;
