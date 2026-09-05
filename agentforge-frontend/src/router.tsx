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
    return (
      <div className="flex h-screen items-center justify-center bg-base-950 text-white">
        Loading AgentForge...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // IMPORTANT: AppShell already contains <Outlet />
  return <AppShell />;
}

// ─── Router ─────────────────────────────────────────────────
export const router = createBrowserRouter([
  // ---------------- Public ----------------
  { path: "/", element: <Navigate to="/login" replace /> },

  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },

  // ---------------- Protected Layout ----------------
  {
    path: "/",
    element: <ProtectedRoute />,
    errorElement: <ErrorBoundaryPage />,
    children: [
      { path: "dashboard", element: <DashboardPage /> },
      { path: "agents", element: <AgentsPage /> },
      { path: "agents/new", element: <AgentCreatePage /> },
      { path: "agents/:id", element: <AgentDetailPage /> },
      { path: "agents/:id/edit", element: <AgentEditPage /> },

      { path: "tasks", element: <TasksPage /> },
      { path: "tasks/new", element: <TaskCreatePage /> },
      { path: "tasks/:id", element: <TaskDetailPage /> },

      { path: "executions", element: <ExecutionsPage /> },
      { path: "executions/:id", element: <ExecutionDetailPage /> },

      { path: "analytics", element: <AnalyticsPage /> },
      { path: "activity", element: <ActivityPage /> },
      { path: "tools", element: <ToolsPage /> },
      { path: "permissions", element: <PermissionsPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "integrations", element: <IntegrationsPage /> },
    ],
  },

  { path: "*", element: <NotFoundPage /> },
]);