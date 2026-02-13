import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set base URL for all axios requests
  axios.defaults.baseURL = 'http://localhost:8080';
  axios.defaults.withCredentials = false; // Important!

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (usernameOrEmail, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        usernameOrEmail,
        password
      });

      if (response.data.success) {
        const { token, username, email } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ username, email }));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser({ username, email });
        setToken(token);
        
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please check your credentials.' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);

      if (response.data.success) {
        const { token, username, email } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ username, email }));
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setUser({ username, email });
        setToken(token);
        
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      console.error('Register error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed. Please try again.' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user
  };

  // Configure axios once in App.jsx or AuthContext.jsx
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};