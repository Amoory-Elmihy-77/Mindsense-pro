import { create } from 'zustand';
import api from '../lib/axios';

const useSubscriptionStore = create((set, get) => ({
  quota: null,
  isLoading: false,
  error: null,

  checkQuota: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/v1/voice/subscription/check');
      set({ quota: res.data.data, isLoading: false });
      return res.data.data;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.response?.data?.message || 'Failed to fetch subscription status' 
      });
      throw error;
    }
  }
}));

export default useSubscriptionStore;
