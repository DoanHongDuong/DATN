import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from './LoadingSpinner';

export const PublicOnlyRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Đang kiểm tra thông tin..." />;
  }

  if (isAuthenticated) {
    const destination = user?.role === 'ADMIN' ? '/admin' : '/dashboard';
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
};
