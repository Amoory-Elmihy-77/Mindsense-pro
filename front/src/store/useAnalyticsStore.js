import { create } from "zustand";
import api from "../lib/axios";

const useAnalyticsStore = create((set, get) => ({
  analysis: null,
  loading: false,
  error: null,
  lastFetched: null,

  fetchAnalysis: async (timeRange = "week") => {
    // Basic caching: if fetched within last 5 minutes, don't refetch
    const { lastFetched, analysis } = get();
    if (analysis && lastFetched && Date.now() - lastFetched < 5 * 60 * 1000) {
      return;
    }

    set({ loading: true, error: null });

    try {
      // Fetch behavioral analytics from our NodeJS backend
      const res = await api.get(`/emotion/trends?timeRange=${timeRange}`);
      const aiData = res.data.data;

      set({
        analysis: aiData,
        loading: false,
        lastFetched: Date.now(),
      });
    } catch (err) {
      console.error("Failed to fetch analytics", err);
      set({
        error: "Failed to generate behavioral insights. Please try again.",
        loading: false,
      });
    }
  },

  clearCache: () => set({ analysis: null, lastFetched: null }),
}));

export default useAnalyticsStore;
