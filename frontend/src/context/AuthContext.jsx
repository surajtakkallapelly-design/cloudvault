import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5001' 
    : window.location.origin);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // Apply theme class to document element on changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Configure Axios Instance
  const api = axios.create({
    baseURL: API_BASE_URL,
  });

  // Request interceptor to automatically add Authorization Header
  api.interceptors.request.use(
    (config) => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const { token } = JSON.parse(storedUser);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle token expiry / unauthorized requests
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        logout();
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Login handler
  const login = async (email, password) => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, error: message };
    }
  };

  // Signup handler
  const signup = async (name, email, password) => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/signup`, {
        name,
        email,
        password,
      });
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Signup failed. Please try again.';
      return { success: false, error: message };
    }
  };



  // Logout handler
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updatedUserData) => {
    const updated = { ...user, ...updatedUserData };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };

  // Request password reset OTP
  const requestOtp = async (email) => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
      return { success: true, message: data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to request OTP. Please try again.';
      return { success: false, error: message };
    }
  };

  // Verify OTP and reset password
  const resetPassword = async (email, otp, newPassword) => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        email,
        otp,
        newPassword,
      });
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to reset password. Please try again.';
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    requestOtp,
    resetPassword,
    theme,
    toggleTheme,
    updateUser,
    api,
    apiBaseUrl: API_BASE_URL
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
