import { create } from 'zustand';
import api from '../lib/axios';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  signup: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/v1/users/signup', userData);
      set({ isLoading: false });
      return res.data;
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.message || 'Signup failed' });
      throw error;
    }
  },

  verify: async (email, code) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/v1/users/verify', { email, code });
      localStorage.setItem('token', res.data.token);
      set({ 
        user: res.data.data.user, 
        token: res.data.token, 
        isAuthenticated: true, 
        isLoading: false 
      });
      return res.data;
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.message || 'Verification failed' });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/v1/users/login', { email, password });
      localStorage.setItem('token', res.data.token);
      set({ token: res.data.token, isAuthenticated: true, isLoading: false });
      return res.data;
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.message || 'Login failed' });
      throw error;
    }
  },

  getMe: async () => {
    if (!get().token) return;
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/v1/users/me');
      set({ user: res.data.data.user, isLoading: false, isAuthenticated: true });
    } catch (error) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      localStorage.removeItem('token');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  }
}));

export default useAuthStore;
