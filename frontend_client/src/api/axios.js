import axios from 'axios';

// 1. Create the Axios instance using the URL from your .env file
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. The "Interceptor"
// Before sending ANY request, check if we have a token in LocalStorage.
// If yes, attach it to the Authorization header.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;