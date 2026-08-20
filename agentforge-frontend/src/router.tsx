// src/router.tsx

import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/AppShell';

// ─── Pages ──────────────────────────────────────────────────
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AgentsPage } from '@/pages/AgentsPage';
import { AgentDetailPage } from '@/pages/AgentDetailPage';
import { AgentCreatePage } from '@/pages/AgentCreatePage';
import { AgentEditPage } from '@/pages/AgentEditPage';
import { TasksPage } from '@/pages/TasksPage';
import { TaskDetailPage } from '@/pages/TaskDetailPage';
import { TaskCreatePage } from '@/pages/TaskCreatePage';
import { ExecutionsPage } from '@/pages/ExecutionsPage';
import { ExecutionDetailPage } from '@/pages/ExecutionDetailPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { ActivityPage } from '@/pages/ActivityPage';
import { ToolsPage } from '@/pages/ToolsPage';
import { PermissionsPage } from '@/pages/PermissionsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { IntegrationsPage } from "@/pages/IntegrationsPage";
import { ErrorBoundaryPage } from '@/pages/ErrorBoundaryPage';

// ─── Protected Route Wrapper ──────────────────────────────
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // You can replace this with a proper loading spinner
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Workaround: AppShell does not currently accept children in its type definition.
  // We cast to any to bypass the type error until the component is fixed.
  // TODO: Update AppShell to include `children: React.ReactNode` in its props.
  const AppShellAny = AppShell as any;

  return (
    <AppShellAny>
      <Outlet />
    </AppShellAny>
  );
}

// ─── Router ─────────────────────────────────────────────────
export const router = createBrowserRouter([
  // Public routes
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },

  // Protected routes
  {
    element: <ProtectedRoute />,
    errorElement: <ErrorBoundaryPage />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/agents', element: <AgentsPage /> },
      { path: '/agents/new', element: <AgentCreatePage /> },
      { path: '/agents/:id', element: <AgentDetailPage /> },
      { path: '/agents/:id/edit', element: <AgentEditPage /> },
      { path: '/tasks', element: <TasksPage /> },
      { path: '/tasks/new', element: <TaskCreatePage /> },
      { path: '/tasks/:id', element: <TaskDetailPage /> },
      { path: '/executions', element: <ExecutionsPage /> },
      { path: '/executions/:id', element: <ExecutionDetailPage /> },
      { path: '/analytics', element: <AnalyticsPage /> },
      { path: '/activity', element: <ActivityPage /> },
      { path: '/tools', element: <ToolsPage /> },
      { path: '/permissions', element: <PermissionsPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/integrations', element: <IntegrationsPage /> },
    ],
  },

  // Fallback 404 (public, for any unmatched route)
  { path: '*', element: <NotFoundPage /> },
]);