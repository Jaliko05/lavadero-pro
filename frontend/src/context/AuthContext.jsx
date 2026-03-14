import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authClient, setAccessToken, setupInterceptors } from '@/api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = useCallback(async () => {
    try {
      await authClient.post('/v1/auth/logout');
    } catch (e) {
      // ignore
    }
    setAccessToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const res = await authClient.post('/v1/auth/refresh');
      const { access_token, user: userData } = res.data;
      setAccessToken(access_token);
      setUser(userData);
      setIsAuthenticated(true);
      return access_token;
    } catch (e) {
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
      return null;
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authClient.post('/v1/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    setAccessToken(access_token);
    setUser(userData);
    setIsAuthenticated(true);
    return userData;
  }, []);

  const hasRole = useCallback((role) => {
    if (!user?.roles) return false;
    if (Array.isArray(user.roles)) return user.roles.includes(role);
    return user.roles === role;
  }, [user]);

  // Silent refresh on mount
  useEffect(() => {
    setupInterceptors(refreshToken, logout);
    refreshToken().finally(() => setIsLoading(false));
  }, [refreshToken, logout]);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshToken,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
