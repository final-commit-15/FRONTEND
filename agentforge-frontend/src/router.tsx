// src/router.tsx

import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppShell } from '@/components/layout/AppShell';
import { Skeleton } from '@/components/ui/Skeleton';

// ─── Lazy-loaded Pages ──────────────────────────────────────────────────
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const AgentsPage = lazy(() => import('@/pages/AgentsPage').then((m) => ({ default: m.AgentsPage })));
const AgentDetailPage = lazy(() => import('@/pages/AgentDetailPage').then((m) => ({ default: m.AgentDetailPage })));
const AgentCreatePage = lazy(() => import('@/pages/AgentCreatePage').then((m) => ({ default: m.AgentCreatePage })));
const AgentEditPage = lazy(() => import('@/pages/AgentEditPage').then((m) => ({ default: m.AgentEditPage })));
const TasksPage = lazy(() => import('@/pages/TasksPage').then((m) => ({ default: m.TasksPage })));
const TaskDetailPage = lazy(() => import('@/pages/TaskDetailPage').then((m) => ({ default: m.TaskDetailPage })));
const TaskCreatePage = lazy(() => import('@/pages/TaskCreatePage').then((m) => ({ default: m.TaskCreatePage })));
const ExecutionsPage = lazy(() => import('@/pages/ExecutionsPage').then((m) => ({ default: m.ExecutionsPage })));
const ExecutionDetailPage = lazy(() => import('@/pages/ExecutionDetailPage').then((m) => ({ default: m.ExecutionDetailPage })));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const ActivityPage = lazy(() => import('@/pages/ActivityPage').then((m) => ({ default: m.ActivityPage })));
const ToolsPage = lazy(() => import('@/pages/ToolsPage').then((m) => ({ default: m.ToolsPage })));
const PermissionsPage = lazy(() => import('@/pages/PermissionsPage').then((m) => ({ default: m.PermissionsPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const IntegrationsPage = lazy(() => import('@/pages/IntegrationsPage').then((m) => ({ default: m.IntegrationsPage })));
const ErrorBoundaryPage = lazy(() => import('@/pages/ErrorBoundaryPage').then((m) => ({ default: m.ErrorBoundaryPage })));

// ─── Loading Fallback ───────────────────────────────────────────────────
function PageLoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-base-950 text-white">
      <div className="space-y-4 text-center">
        <Skeleton variant="circular" className="w-12 h-12 mx-auto" />
        <Skeleton variant="text" className="w-48 mx-auto" />
      </div>
    </div>
  );
}

function ProtectedRouteLoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-base-950 text-white">
      <div className="space-y-4 text-center">
        <Skeleton variant="circular" className="w-12 h-12 mx-auto" />
        <Skeleton variant="text" className="w-64 mx-auto" />
      </div>
    </div>
  );
}

// ─── Protected Route Wrapper ────────────────────────────────────────────
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <ProtectedRouteLoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <AppShell />
    </Suspense>
  );
}

// ─── Public Route Wrapper with Suspense ─────────────────────────────────
function PublicRoute({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      {children}
    </Suspense>
  );
}

// ─── Router ─────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  // ---------------- Public ----------------
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  },

  {
    path: "/login",
    element: <PublicRoute><LoginPage /></PublicRoute>,
  },
  {
    path: "/register",
    element: <PublicRoute><RegisterPage /></PublicRoute>,
  },
  {
    path: "/forgot-password",
    element: <PublicRoute><ForgotPasswordPage /></PublicRoute>,
  },

  // ---------------- Protected Layout ----------------
  {
    path: "/",
    element: <ProtectedRoute />,
    errorElement: <Suspense fallback={<PageLoadingFallback />}><ErrorBoundaryPage /></Suspense>,
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

  { path: "*", element: <Suspense fallback={<PageLoadingFallback />}><NotFoundPage /></Suspense> },
]);