import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5020/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const method = (config.method || 'get').toLowerCase();

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else if (method === 'get' || method === 'head' || method === 'delete') {
    // Express 5 rejects GET requests that send Content-Type: application/json with no body
    delete config.headers['Content-Type'];
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
