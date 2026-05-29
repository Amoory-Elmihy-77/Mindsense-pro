import { create } from "zustand";
import api from "../lib/axios";

const wsUrl = () => {
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:5020/api";
  const root = base.replace(/\/api\/?$/, "");
  return root.replace(/^http/, "ws");
};

const useCommunityStore = create((set, get) => ({
  overview: null,
  feed: [],
  commentsByPost: {},
  selectedPostId: null,
  commentsLoading: false,
  circles: [],
  challenges: [],
  myChallenges: [],
  rooms: [],
  groupSessions: [],
  buddies: [],
  leaderboard: [],
  notifications: [],
  moderationQueue: null,
  activeTab: "feed",
  loading: false,
  error: null,
  socket: null,
  realtimeStatus: "offline",

  setTab: (activeTab) => set({ activeTab }),

  openPost: async (postId) => {
    set({ selectedPostId: postId });
    await get().fetchComments(postId);
  },

  closePost: () => set({ selectedPostId: null }),

  connectRealtime: () => {
    const token = localStorage.getItem("token");
    if (!token || get().socket) return;

    try {
      const socket = new WebSocket(`${wsUrl()}/ws/community?token=${encodeURIComponent(token)}`);
      socket.onopen = () => set({ realtimeStatus: "online" });
      socket.onclose = () => set({ realtimeStatus: "offline", socket: null });
      socket.onerror = () => set({ realtimeStatus: "error" });
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === "notification") {
            set((state) => ({
              notifications: [payload.data, ...state.notifications].slice(0, 50),
            }));
          }
          if (payload.event === "feed:update") {
            get().fetchFeed();
          }
        } catch {
          // Ignore malformed realtime frames.
        }
      };
      set({ socket });
    } catch {
      set({ realtimeStatus: "error" });
    }
  },

  disconnectRealtime: () => {
    const socket = get().socket;
    if (socket) socket.close();
    set({ socket: null, realtimeStatus: "offline" });
  },

  fetchOverview: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get("/community/overview");
      set({ overview: res.data.data, loading: false });
      return res.data.data;
    } catch (error) {
      set({ loading: false, error: error.response?.data?.message || "Community failed to load" });
      throw error;
    }
  },

  fetchFeed: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await api.get(`/feed${query ? `?${query}` : ""}`);
    set({ feed: res.data.data });
    return res.data.data;
  },

  createPost: async (payload) => {
    const res = await api.post("/feed", payload);
    await get().fetchFeed();
    return res.data.data;
  },

  reactToPost: async (postId, type = "support") => {
    await api.post(`/feed/${postId}/react`, { type });
    await get().fetchFeed();
  },

  savePost: async (postId) => api.post(`/feed/${postId}/save`),
  sharePost: async (postId) => api.post(`/feed/${postId}/share`),
  report: async (payload) => api.post("/community/reports", payload),

  fetchComments: async (postId) => {
    set({ commentsLoading: true });
    try {
      const res = await api.get(`/feed/${postId}/comments`);
      set((state) => ({
        commentsByPost: { ...state.commentsByPost, [postId]: res.data.data },
        commentsLoading: false,
      }));
      return res.data.data;
    } catch (error) {
      set({ commentsLoading: false });
      throw error;
    }
  },

  addComment: async (postId, content, visibility = "nickname") => {
    await api.post(`/feed/${postId}/comments`, { content, visibility });
    await Promise.all([get().fetchFeed(), get().fetchComments(postId)]);
  },

  fetchCircles: async () => {
    const res = await api.get("/circles");
    set({ circles: res.data.data });
    return res.data.data;
  },

  joinCircle: async (circleId) => {
    await api.post(`/circles/${circleId}/join`);
    await Promise.all([get().fetchCircles(), get().fetchOverview()]);
  },

  leaveCircle: async (circleId) => {
    await api.post(`/circles/${circleId}/leave`);
    await Promise.all([get().fetchCircles(), get().fetchOverview()]);
  },

  checkIn: async (payload) => {
    const res = await api.post("/community/checkins", payload);
    await Promise.all([get().fetchOverview(), get().fetchFeed()]);
    return res.data.data;
  },

  fetchChallenges: async () => {
    const [all, mine] = await Promise.all([api.get("/challenges"), api.get("/challenges/me")]);
    set({ challenges: all.data.data, myChallenges: mine.data.data });
  },

  joinChallenge: async (challengeId) => {
    await api.post(`/challenges/${challengeId}/join`);
    await get().fetchChallenges();
  },

  completeChallenge: async (challengeId) => {
    await api.post(`/challenges/${challengeId}/complete`);
    await Promise.all([get().fetchChallenges(), get().fetchOverview(), get().fetchLeaderboard()]);
  },

  fetchRooms: async () => {
    const res = await api.get("/rooms");
    set({ rooms: res.data.data });
  },

  fetchGroupSessions: async () => {
    const res = await api.get("/group-sessions");
    set({ groupSessions: res.data.data });
  },

  createGroupSession: async (payload) => {
    await api.post("/group-sessions", payload);
    await get().fetchGroupSessions();
  },

  joinGroupSession: async (sessionId) => {
    await api.post(`/group-sessions/${sessionId}/join`);
    await get().fetchGroupSessions();
  },

  joinRoom: async (roomId) => {
    await api.post(`/rooms/${roomId}/join`);
    await get().fetchRooms();
  },

  sendRoomMessage: async (roomId, content, visibility = "nickname") => {
    await api.post(`/rooms/${roomId}/messages`, { content, visibility });
  },

  fetchBuddies: async () => {
    const res = await api.get("/buddies");
    set({ buddies: res.data.data });
  },

  inviteBuddy: async (recipientId, sharedGoals = []) => {
    await api.post("/buddies/invite", { recipientId, sharedGoals });
    await get().fetchBuddies();
  },

  acceptBuddy: async (buddyId) => {
    await api.post(`/buddies/${buddyId}/accept`);
    await get().fetchBuddies();
  },

  encourageBuddy: async (buddyId, message) => {
    await api.post(`/buddies/${buddyId}/encourage`, { message });
    await get().fetchBuddies();
  },

  fetchLeaderboard: async () => {
    const res = await api.get("/leaderboard");
    set({ leaderboard: res.data.data });
  },

  fetchNotifications: async () => {
    const res = await api.get("/notifications");
    set({ notifications: res.data.data });
  },

  readNotification: async (notificationId) => {
    await api.patch(`/notifications/${notificationId}/read`);
    await get().fetchNotifications();
  },

  fetchModerationQueue: async () => {
    const res = await api.get("/moderation/queue");
    set({ moderationQueue: res.data.data });
  },

  moderatePost: async (postId, action, reason = "") => {
    await api.post(`/moderation/posts/${postId}/action`, { action, reason });
    await get().fetchModerationQueue();
  },
}));

export default useCommunityStore;
