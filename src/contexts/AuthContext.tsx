import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';
import axiosInstance from '../utils/axios';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Configure axios defaults and verify token
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = localStorage.getItem('_SMART_BUILDING_TOKEN_');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await axiosInstance.get('/api/users/me');
        setIsAuthenticated(true);
        setUser(response.data);
      } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem('_SMART_BUILDING_TOKEN_');
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (token: string) => {
    try {
      localStorage.setItem('_SMART_BUILDING_TOKEN_', token);
      const response = await axiosInstance.get('/api/users/me');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      logout();
    }
  };

  const logout = () => {
    localStorage.removeItem('_SMART_BUILDING_TOKEN_');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 