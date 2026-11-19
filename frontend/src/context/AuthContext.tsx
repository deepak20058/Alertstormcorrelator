import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { IUser, UserRole } from '../types';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: { username: string; email: string; password: string; name: string; role?: UserRole }) => Promise<void>;
  demoLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('alertstorm_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('alertstorm_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
          } else {
            logout();
          }
        } catch (err) {
          console.warn('Failed to verify token, clearing session:', err);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    if (res.data.success && res.data.token) {
      localStorage.setItem('alertstorm_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    } else {
      throw new Error(res.data.message || 'Login failed');
    }
  };

  const register = async (data: { username: string; email: string; password: string; name: string; role?: UserRole }) => {
    const res = await api.post('/auth/register', data);
    if (res.data.success && res.data.token) {
      localStorage.setItem('alertstorm_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    } else {
      throw new Error(res.data.message || 'Registration failed');
    }
  };

  const demoLogin = async (role: UserRole) => {
    const res = await api.post('/auth/demo-login', { role });
    if (res.data.success && res.data.token) {
      localStorage.setItem('alertstorm_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    } else {
      throw new Error(res.data.message || 'Demo login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('alertstorm_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        demoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
