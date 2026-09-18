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
const ProjectIntakePage = lazy(() => import('@/pages/ProjectIntakePage').then((m) => ({ default: m.ProjectIntakePage })));
const TasksPage = lazy(() => import('@/pages/TasksPage').then((m) => ({ default: m.TasksPage })));
const TaskDetailPage = lazy(() => import('@/pages/TaskDetailPage').then((m) => ({ default: m.TaskDetailPage })));
const TaskCreatePage = lazy(() => import('@/pages/TaskCreatePage').then((m) => ({ default: m.TaskCreatePage })));
const TaskEditPage = lazy(() => import('@/pages/TaskEditPage').then((m) => ({ default: m.TaskEditPage })));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const ErrorBoundaryPage = lazy(() => import('@/pages/ErrorBoundaryPage').then((m) => ({ default: m.ErrorBoundaryPage })));
// New pages
const SprintJournalPage = lazy(() => import('@/pages/SprintJournalPage').then((m) => ({ default: m.SprintJournalPage })));
const TeamMembersPage = lazy(() => import('@/pages/TeamMembersPage').then((m) => ({ default: m.TeamMembersPage })));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage })));
const GitHubReviewsPage = lazy(() => import('@/pages/GitHubReviewsPage').then((m) => ({ default: m.GitHubReviewsPage })));
const KnowledgeBasePage = lazy(() => import('@/pages/KnowledgeBasePage').then((m) => ({ default: m.KnowledgeBasePage })));
const SprintsPage = lazy(() => import('@/pages/SprintsPage').then((m) => ({ default: m.SprintsPage })));
const MonitorPage = lazy(() => import('@/pages/MonitorPage').then((m) => ({ default: m.MonitorPage })));
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));

// ─── Loading Fallback ───────────────────────────────────────────────────
function PageLoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-bg-primary text-text-primary">
      <div className="space-y-4 text-center">
        <Skeleton variant="circular" className="w-12 h-12 mx-auto" />
        <Skeleton variant="text" className="w-48 mx-auto" />
      </div>
    </div>
  );
}

function ProtectedRouteLoadingFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-bg-primary text-text-primary">
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
      { path: "projects", element: <ProjectsPage /> },
      { path: "projects/:projectId", element: <ProjectDetailPage /> },
      { path: "ai-intake", element: <ProjectIntakePage /> },
      { path: "tasks", element: <TasksPage /> },
      { path: "tasks/new", element: <TaskCreatePage /> },
      { path: "tasks/:id", element: <TaskDetailPage /> },
      { path: "tasks/:id/edit", element: <TaskEditPage /> },
      { path: "sprints", element: <SprintsPage /> },
      { path: "teams", element: <TeamMembersPage /> },
      { path: "team-members", element: <Navigate to="/teams" replace /> },
      { path: "monitor", element: <MonitorPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "github-reviews", element: <GitHubReviewsPage /> },
      { path: "knowledge-base", element: <KnowledgeBasePage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },

  { path: "*", element: <Suspense fallback={<PageLoadingFallback />}><NotFoundPage /></Suspense> },
]);