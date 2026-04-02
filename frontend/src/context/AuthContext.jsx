import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/api/auth/me');
      const updated = res.data;
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
    } catch (_) {}
  };

  // Instantly update profile photo everywhere without waiting for approval
  const updateProfilePhoto = (dataUrl) => {
    setUser(prev => {
      const updated = { ...prev, profile_photo: dataUrl };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const hasModule = (module) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.allowed_modules?.includes(module) ?? false;
  };

  const isAdmin = () => user?.role === 'admin';
  const isManager = () => user?.role === 'manager';
  const isEmployee = () => user?.role === 'employee';

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, updateProfilePhoto, hasModule, isAdmin, isManager, isEmployee, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
