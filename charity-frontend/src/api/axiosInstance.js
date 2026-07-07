import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach access token ──────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// ── Response: auto-refresh on 401 ────────────────────────────
axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // Don't retry auth endpoints to avoid loops
    const isAuthEndpoint = original.url?.includes('/api/auth/');

    if (err.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const res = await axios.post(
          'http://localhost:8080/api/auth/refresh-token',
          {},
          { withCredentials: true }
        );
        const newToken = res.data?.data?.accessToken;
        if (newToken) {
          localStorage.setItem('access_token', newToken);

          // Also update stored user object
          try {
            const stored = localStorage.getItem('auth_user');
            if (stored) {
              const u = JSON.parse(stored);
              u.accessToken = newToken;
              localStorage.setItem('auth_user', JSON.stringify(u));
            }
          } catch {}

          original.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(original);
        }
      } catch {
        // Refresh failed — clear everything and redirect to login
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(err);
  }
);

export default axiosInstance;
