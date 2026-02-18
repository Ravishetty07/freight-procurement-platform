import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 1. On page load, check if we have a token
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            // We assume the user is logged in if a token exists
            // Later we can verify this with the backend
            setUser({ name: "Admin User" }); 
        }
        setLoading(false);
    }, []);

    // 2. Login Function
    const login = async (username, password) => {
        try {
            // Hits Django at: http://127.0.0.1:8000/api/v1/token/
            const response = await api.post('/token/', { username, password });
            
            // Save tokens to browser storage
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            
            setUser({ username });
            return { success: true };
        } catch (error) {
            console.error("Login Error:", error);
            return { 
                success: false, 
                msg: error.response?.data?.detail || "Server connection failed" 
            };
        }
    };

    // 3. Logout Function
    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// Hook to use auth easily in other files
export const useAuth = () => useContext(AuthContext);