import { create } from 'zustand';

// Persist emotion state so EmotionTracker and Games page share the same data
const useEmotionStore = create((set, get) => ({
  // Current detected state
  emotion: localStorage.getItem('ms_emotion') || 'neutral',        // sad | anxious | happy | angry | neutral
  energy_level: localStorage.getItem('ms_energy') || 'medium',     // low | medium | high
  user_behavior: localStorage.getItem('ms_behavior') || 'focused', // focused | distracted
  confidence: parseFloat(localStorage.getItem('ms_confidence')) || 0,

  setEmotion: (emotion, energy_level = 'medium', user_behavior = 'focused', confidence = 0) => {
    const norm = emotion.toLowerCase();
    localStorage.setItem('ms_emotion', norm);
    localStorage.setItem('ms_energy', energy_level);
    localStorage.setItem('ms_behavior', user_behavior);
    localStorage.setItem('ms_confidence', confidence);
    set({ emotion: norm, energy_level, user_behavior, confidence });
  },

  reset: () => {
    localStorage.removeItem('ms_emotion');
    localStorage.removeItem('ms_energy');
    localStorage.removeItem('ms_behavior');
    localStorage.removeItem('ms_confidence');
    set({ emotion: 'neutral', energy_level: 'medium', user_behavior: 'focused', confidence: 0 });
  },
}));

export default useEmotionStore;
