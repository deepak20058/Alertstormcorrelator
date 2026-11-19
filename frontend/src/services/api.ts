import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('alertstorm_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if checking auth or on login page
      if (!window.location.pathname.includes('/login')) {
        // optionally clear token
      }
    }
    return Promise.reject(error);
  }
);

export default api;
