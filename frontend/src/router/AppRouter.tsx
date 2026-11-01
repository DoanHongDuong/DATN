import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { PublicOnlyRoute } from '../components/common/PublicOnlyRoute';
import { HomePage } from '../pages/HomePage';
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from '../pages/auth';
import { DashboardPage } from '../pages/DashboardPage';
import { AssessmentPage } from '../pages/AssessmentPage';
import { JournalPage } from '../pages/JournalPage';
import { ChatPage } from '../pages/ChatPage';
import { ResourcesPage } from '../pages/ResourcesPage';
import { VolunteerApplyPage } from '../pages/volunteer/VolunteerApplyPage';
import { ProfilePage } from '../pages/ProfilePage';
import { AdminVolunteersPage } from '../pages/admin/AdminVolunteersPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminResourcesPage } from '../pages/admin/AdminResourcesPage';
import { AdminAuditLogsPage } from '../pages/admin/AdminAuditLogsPage';
import { AdminStatsPage } from '../pages/admin/AdminStatsPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Public General Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/verify-email" element={<Navigate to="/login" replace />} />

          {/* Guest-only Routes (Redirect to app if already authenticated) */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Protected Routes (Authentication Required) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/assessments" element={<AssessmentPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/volunteer/apply" element={<VolunteerApplyPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Direct aliases for interactive relaxation guides */}
            <Route path="/pmr-guide" element={<Navigate to="/resources?open=pmr-guide" replace />} />
            <Route path="/grounding-54321" element={<Navigate to="/resources?open=grounding-54321" replace />} />
            <Route path="/box-breathing" element={<Navigate to="/resources?open=box-breathing" replace />} />
            <Route path="/diaphragmatic" element={<Navigate to="/resources?open=diaphragmatic" replace />} />
            <Route path="/4-7-8" element={<Navigate to="/resources?open=4-7-8" replace />} />
          </Route>

          {/* Admin Protected Routes (Role ADMIN Required) */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<Navigate to="/admin/stats" replace />} />
            <Route path="/admin/stats" element={<AdminStatsPage />} />
            <Route path="/admin/volunteers" element={<AdminVolunteersPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/resources" element={<AdminResourcesPage />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
