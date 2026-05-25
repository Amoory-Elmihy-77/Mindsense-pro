import { create } from 'zustand';
import api from '../lib/axios';

const useVoiceStore = create((set, get) => ({
  session: null,
  messages: [],
  status: 'idle',
  error: null,
  isRecording: false,
  remainingMinutes: 0,
  voiceSettings: null,

  fetchVoiceSettings: async () => {
    const res = await api.get('/v1/voice/settings');
    set({ voiceSettings: res.data.data });
    return res.data.data;
  },

  updateVoiceSettings: async (updates) => {
    const res = await api.patch('/v1/voice/settings', updates);
    set({ voiceSettings: res.data.data });
    return res.data.data;
  },

  previewVoice: async (settings) => {
    const res = await api.post('/v1/voice/settings/preview', settings);
    return res.data.data;
  },

  startSession: async (emotion) => {
    set({ status: 'starting', error: null, messages: [] });
    try {
      const res = await api.post('/v1/voice/session/start', { emotion });
      const data = res.data.data;

      set({
        session: { sessionId: data.sessionId, status: 'active', emotion },
        messages: [{ role: 'assistant', content: data.greetingText, audioBase64: data.greetingAudio }],
        remainingMinutes: data.remainingMinutes,
        status: 'active',
      });
      return data;
    } catch (error) {
      const isQuota = error.response?.status === 402;
      set({
        status: isQuota ? 'quota_exceeded' : 'error',
        error: error.response?.data?.message || 'Failed to start session',
        remainingMinutes: error.response?.data?.remainingMinutes ?? 0,
      });
      throw error;
    }
  },

  sendMessage: async (audioBlob, emotion) => {
    const { session } = get();
    if (!session || session.status !== 'active') return;

    set({ isRecording: false, status: 'processing' });

    try {
      const formData = new FormData();
      formData.append('sessionId', session.sessionId);
      formData.append('emotion', emotion);
      formData.append('audio', audioBlob, 'audio.webm');

      const res = await api.post('/v1/voice/session/message', formData);
      const data = res.data.data;

      set((state) => ({
        messages: [
          ...state.messages,
          { role: 'user', content: data.transcript },
          { role: 'assistant', content: data.responseText, audioBase64: data.responseAudio },
        ],
        remainingMinutes: data.remainingMinutes,
        status: 'active',
      }));
      return data;
    } catch (error) {
      const isQuota = error.response?.status === 402;
      const message = error.response?.data?.message || 'Failed to process message';
      set({
        status: isQuota ? 'quota_exceeded' : 'error',
        error: message,
        remainingMinutes: error.response?.data?.remainingMinutes ?? get().remainingMinutes,
      });
      throw error;
    }
  },

  endSession: async () => {
    const { session } = get();
    if (!session) return;

    set({ status: 'ending' });
    try {
      const res = await api.post('/v1/voice/session/end', { sessionId: session.sessionId });
      set({ status: 'ended', session: { ...session, status: 'completed' } });
      return res.data.data.summary;
    } catch (error) {
      set({ status: 'error', error: error.response?.data?.message || 'Failed to end session' });
      throw error;
    }
  },

  clearSession: () => {
    set({ session: null, messages: [], status: 'idle', error: null });
  },
}));

export default useVoiceStore;
