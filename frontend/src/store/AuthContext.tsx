import React, { useState, useEffect, useCallback } from 'react';
import { authApi, type LoginPayload, type RegisterPayload, type AuthResponse } from '../api/auth.api';
import { AuthContext, type User } from './auth.context';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const setAuthData = useCallback((data: AuthResponse) => {
    setToken(data.accessToken);
    setUser(data.user);
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
  }, []);

  const updateUser = useCallback((updatedFields: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const profile = await authApi.getMe();
          if (isMounted) {
            const currentUserJson = localStorage.getItem('user');
            const parsedUser = currentUserJson ? JSON.parse(currentUserJson) : null;
            const updatedUser: User = {
              id: profile.userId,
              email: parsedUser?.email || '',
              fullName: parsedUser?.fullName || 'Người dùng',
              role: profile.role,
            };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.error('Failed to verify session token:', error);
          if (isMounted) {
            logout();
          }
        }
      } else {
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      }
      if (isMounted) {
        setIsLoading(false);
      }
    };

    initAuth();

    // Đồng bộ trạng thái khi bấm return / back (bfcache), đổi tab, hoặc 401
    const syncAuthFromStorage = () => {
      const currentToken = localStorage.getItem('token');
      const currentUserJson = localStorage.getItem('user');
      if (!currentToken || !currentUserJson) {
        logout();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        syncAuthFromStorage();
      }
    };

    const handlePageShow = () => {
      syncAuthFromStorage();
    };

    const handlePopState = () => {
      syncAuthFromStorage();
    };

    const handleCustomLogout = () => {
      logout();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('auth:logout', handleCustomLogout);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('auth:logout', handleCustomLogout);
    };
  }, [logout]);

  const login = async (payload: LoginPayload) => {
    const response = await authApi.login(payload);
    setAuthData(response);
  };

  const register = async (payload: RegisterPayload) => {
    await authApi.register(payload);
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isLoading,
        login,
        register,
        setAuthData,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
