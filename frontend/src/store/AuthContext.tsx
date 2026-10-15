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
      }
      if (isMounted) {
        setIsLoading(false);
      }
    };

    initAuth();
    return () => {
      isMounted = false;
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
        isAuthenticated: !!token,
        isLoading,
        login,
        register,
        setAuthData,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
