import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { HomePage } from '../pages/HomePage';
import { LoginPage, RegisterPage, ForgotPasswordPage, VerifyEmailPage, ResetPasswordPage } from '../pages/auth';
import { DashboardPage } from '../pages/DashboardPage';
import { AssessmentPage } from '../pages/AssessmentPage';
import { JournalPage } from '../pages/JournalPage';
import { ChatPage } from '../pages/ChatPage';
import { ResourcesPage } from '../pages/ResourcesPage';
import { VolunteerApplyPage } from '../pages/volunteer/VolunteerApplyPage';
import { AdminVolunteersPage } from '../pages/admin/AdminVolunteersPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Routes (Authentication Required) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/assessments" element={<AssessmentPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/volunteer/apply" element={<VolunteerApplyPage />} />
          </Route>

          {/* Admin Protected Routes (Role ADMIN Required) */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<Navigate to="/admin/volunteers" replace />} />
            <Route path="/admin/volunteers" element={<AdminVolunteersPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
