import axios from 'axios';

// Always talk to /api on the same host as this page (no manual “connect frontend to backend”):
// - npm run dev: Vite proxies /api → localhost:8000 (vite.config.js)
// - Docker / Render (root Dockerfile): UI + API are one service, one URL
// Only set VITE_API_BASE_URL if you intentionally split UI and API across different domains.
const baseURL = (import.meta.env.VITE_API_BASE_URL ?? '').trim();

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
