import { useState, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, getStoredUser } from '../utils/api.js';

export function useAuth() {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (pin) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiLogin(pin);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    setError(null);
  }, []);

  return {
    user,
    isLoggedIn: !!user,
    isSenior: user?.role === 'senior',
    isFamily: user?.role === 'family',
    loading,
    error,
    login,
    logout,
    clearError: () => setError(null),
  };
}
