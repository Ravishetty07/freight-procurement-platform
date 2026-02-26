import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
    // FIX 1: Add a 120-second timeout to allow Render's free tier time to wake up.
    timeout: 120000, 
});

// Automatically add the Token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 (Logout if token expires)
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            window.location.href = '/login';
        }
        // FIX 2: Catch Network Timeouts or Render 502/503 errors (Sleeping Server)
        else if (error.code === 'ECONNABORTED' || !error.response || error.response.status >= 500) {
            console.warn("Server might be sleeping or unreachable.");
            // Attach a custom flag so our Login.jsx knows this isn't a password error
            error.isServerWakeup = true; 
        }
        
        return Promise.reject(error);
    }
);

export default api;