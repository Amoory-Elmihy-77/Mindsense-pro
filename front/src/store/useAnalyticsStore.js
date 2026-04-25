import { create } from 'zustand';
import axios from 'axios';
import api from '../lib/axios';

const useAnalyticsStore = create((set, get) => ({
  analysis: null,
  loading: false,
  error: null,
  lastFetched: null,

  fetchAnalysis: async (timeRange = 'week') => {
    // Basic caching: if fetched within last 5 minutes, don't refetch
    const { lastFetched, analysis } = get();
    if (analysis && lastFetched && (Date.now() - lastFetched < 5 * 60 * 1000)) {
      return;
    }

    set({ loading: true, error: null });

    try {
      // 1. Fetch emotion history from our NodeJS backend
      const res = await api.get('/emotion/history?limit=100');
      const history = res.data.data || [];

      // 2. Format it for the AI Server
      const user_emotions = history.map(entry => ({
        date: entry.createdAt,
        emotion: entry.state,
        confidence: entry.confidence || 0
      }));

      // 3. Hit the python AI server directly for pure-python behavioral analytics
      const AI_BASE_URL = import.meta.env.VITE_AI_BASE_URL || 'http://localhost:8000';
      const aiRes = await axios.post(`${AI_BASE_URL}/analyze-trends`, {
        user_emotions,
        time_range: timeRange
      });

      set({
        analysis: aiRes.data,
        loading: false,
        lastFetched: Date.now()
      });

    } catch (err) {
      console.error("Failed to fetch analytics", err);
      set({ 
        error: "Failed to generate behavioral insights. Please try again.", 
        loading: false 
      });
    }
  },

  clearCache: () => set({ analysis: null, lastFetched: null })
}));

export default useAnalyticsStore;
