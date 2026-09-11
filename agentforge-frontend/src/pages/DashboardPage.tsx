// src/pages/DashboardPage.tsx

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics';
import { teamMembersApi } from '@/api/team_members';
import { useAuth } from '@/hooks/useAuth';
import { useSprintStore } from '@/store/sprintStore';

import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiGrid } from '@/components/dashboard/KpiGrid';
import { ExecutionActivityChart } from '@/components/dashboard/ExecutionActivityChart';
import { AgentPerformance } from '@/components/dashboard/AgentPerformance';
import { SystemHealth } from '@/components/dashboard/SystemHealth';
import { SprintProgressRing } from '@/components/dashboard/SprintProgressRing';
import { StoryPointsProgress } from '@/components/dashboard/StoryPointsProgress';
import { TeamWorkloadHeatmap } from '@/components/dashboard/TeamWorkloadHeatmap';
import { TaskStatusCards } from '@/components/dashboard/TaskStatusCards';
import { FeatureStatusCards } from '@/components/dashboard/FeatureStatusCards';
import { PendingPRsComponent } from '@/components/dashboard/PendingPRs';
import { AIActivitySummaryComponent } from '@/components/dashboard/AIActivitySummary';
import { ActivityTimeline } from '@/components/dashboard/ActivityTimeline';
import { UpcomingDeadlines } from '@/components/dashboard/UpcomingDeadlines';
import { RecentDecisions } from '@/components/dashboard/RecentDecisions';
import { BlockerSummary } from '@/components/dashboard/BlockerSummary';
import { BurndownChart } from '@/components/dashboard/BurndownChart';
import { VelocityChart } from '@/components/dashboard/VelocityChart';
import { FeatureProgressPie } from '@/components/dashboard/FeatureProgressPie';
import { DailyCompletedTasksChart } from '@/components/dashboard/DailyCompletedTasksChart';
import { BlockerTrendChart } from '@/components/dashboard/BlockerTrendChart';
import { QAPassRateChart } from '@/components/dashboard/QAPassRateChart';
import { SprintHealthIndicator } from '@/components/dashboard/SprintHealthIndicator';
import { TrendingUp, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { differenceInDays } from 'date-fns';

function SectionLabel({ icon, title, hint }: { icon: React.ElementType; title: string; hint?: string }) {
  const Icon = icon;
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-brand-primary" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-text-heading leading-tight">{title}</h2>
        {hint && <p className="text-xs text-text-muted">{hint}</p>}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { activeSprintId } = useSprintStore();

  // ── Queries ──────────────────────────────────────────────────
  const dashboardKPIsQuery = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => analyticsApi.getDashboardKPIs(),
    retry: false,
  });

  const sprintProgressQuery = useQuery({
    queryKey: ['sprint', 'progress', activeSprintId],
    queryFn: () => analyticsApi.getSprintProgress(activeSprintId),
    retry: false,
    enabled: !!activeSprintId,
  });

  const teamWorkloadQuery = useQuery({
    queryKey: ['team', 'workload'],
    queryFn: () => analyticsApi.getTeamWorkload(),
    retry: false,
  });

  const taskStatusQuery = useQuery({
    queryKey: ['tasks', 'status-summary'],
    queryFn: () => analyticsApi.getTaskStatusSummary(),
    retry: false,
  });

  const featureStatusQuery = useQuery({
    queryKey: ['features', 'status-summary'],
    queryFn: () => analyticsApi.getFeatureStatusSummary(),
    retry: false,
  });

  const pendingPRsQuery = useQuery({
    queryKey: ['github', 'pending-prs'],
    queryFn: () => analyticsApi.getPendingPRs(),
    retry: false,
  });

  const aiActivityQuery = useQuery({
    queryKey: ['ai', 'activity-summary'],
    queryFn: () => analyticsApi.getAIActivitySummary(),
    retry: false,
  });

  const recentActivityQuery = useQuery({
    queryKey: ['activity', 'recent'],
    queryFn: () => analyticsApi.getRecentActivity(15),
    retry: false,
  });

  const upcomingDeadlinesQuery = useQuery({
    queryKey: ['deadlines', 'upcoming'],
    queryFn: () => analyticsApi.getUpcomingDeadlines(8),
    retry: false,
  });

  const recentDecisionsQuery = useQuery({
    queryKey: ['decisions', 'recent'],
    queryFn: () => analyticsApi.getRecentDecisions(5),
    retry: false,
  });

  const blockerSummaryQuery = useQuery({
    queryKey: ['blockers', 'summary'],
    queryFn: () => analyticsApi.getBlockerSummary(),
    retry: false,
  });

  const teamMembersQuery = useQuery({
    queryKey: ['team-members'],
    queryFn: () => teamMembersApi.list(),
    retry: false,
  });

  // ── Loading / Error States ────────────────────────────────
  const isLoading = dashboardKPIsQuery.isLoading || sprintProgressQuery.isLoading ||
    teamWorkloadQuery.isLoading || taskStatusQuery.isLoading ||
    featureStatusQuery.isLoading || pendingPRsQuery.isLoading ||
    aiActivityQuery.isLoading || recentActivityQuery.isLoading ||
    upcomingDeadlinesQuery.isLoading || recentDecisionsQuery.isLoading ||
    blockerSummaryQuery.isLoading;

  const isError = dashboardKPIsQuery.isError || (sprintProgressQuery.isError && !!activeSprintId) ||
    teamWorkloadQuery.isError || taskStatusQuery.isError ||
    featureStatusQuery.isError || pendingPRsQuery.isError ||
    aiActivityQuery.isError || recentActivityQuery.isError ||
    upcomingDeadlinesQuery.isError || recentDecisionsQuery.isError ||
    blockerSummaryQuery.isError;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Skeleton variant="title" className="w-56" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton variant="card" className="h-80" />
          <Skeleton variant="card" className="h-80" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        description="Unable to load dashboard data. Please try again later."
        onRetry={() => {
          dashboardKPIsQuery.refetch();
          sprintProgressQuery.refetch();
          teamWorkloadQuery.refetch();
          taskStatusQuery.refetch();
          featureStatusQuery.refetch();
          pendingPRsQuery.refetch();
          aiActivityQuery.refetch();
          recentActivityQuery.refetch();
          upcomingDeadlinesQuery.refetch();
          recentDecisionsQuery.refetch();
          blockerSummaryQuery.refetch();
        }}
      />
    );
  }

  // ── Data ────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name?.split(' ')[0] || 'User';

  const activeSprint = sprintProgressQuery.data || null;
  const blockers = blockerSummaryQuery.data || { total: 0, by_status: {}, by_priority: {}, oldest_open: null };

  // Burndown data from sprint progress
  const burndownData = activeSprint && activeSprint.story_points_total
    ? Array.from({ length: 8 }, (_, i) => ({
        date: new Date(Date.now() - (7 - i) * 86400000).toISOString().slice(0, 10),
        ideal: Math.max(0, activeSprint.story_points_total * (1 - (i + 1) / 8)),
        actual: Math.max(0, activeSprint.story_points_total * (1 - ((i + 1) * (activeSprint.completion / 100)) / 1.2)),
      }))
    : [];

  const featurePieData = featureStatusQuery.data
    ? [
        { name: 'Completed', value: featureStatusQuery.data.completed || 0 },
        { name: 'In Progress', value: featureStatusQuery.data.in_progress || 0 },
        { name: 'In Review', value: featureStatusQuery.data.in_review || 0 },
        { name: 'Planned', value: featureStatusQuery.data.planned || 0 },
        { name: 'Archived', value: featureStatusQuery.data.archived || 0 },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-12 animate-fade-in">
      <PageHeader
        title={`${greeting}, ${firstName}`}
        description="Here's what's happening across your engineering projects."
      />

      {/* KPI Cards */}
      <section>
        <SectionLabel icon={TrendingUp} title="Key Metrics" hint="Live overview of your workspace" />
        <KpiGrid />
      </section>

      {/* Sprint Progress, Story Points & Health */}
      <section>
        <SectionLabel icon={CheckCircle2} title="Sprint Status" hint="Progress, points, and AI health assessment" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SprintProgressRing sprint={activeSprint} />
          <StoryPointsProgress
            completed={dashboardKPIsQuery.data?.story_points_completed || 0}
            total={dashboardKPIsQuery.data?.story_points_total || 0}
          />
          {(() => {
            const sprint = activeSprint;
            if (!sprint) return null;
            const daysRemaining = sprint.days_remaining ?? 0;
            const health = daysRemaining < 0 ? 'delayed'
              : (daysRemaining <= 2 || (sprint.story_points_total > 0 && (sprint.story_points_completed / sprint.story_points_total) < 0.5)) ? 'at_risk' : 'healthy';
            return (
              <SprintHealthIndicator
                health={health}
                metrics={{
                  completion: sprint.completion || 0,
                  daysRemaining,
                  openBlockers: blockers.total || 0,
                  velocity: sprint.velocity || 0,
                  plannedVelocity: sprint.velocity || 0,
                }}
              />
            );
          })()}
        </div>
      </section>

      {/* Task & Feature Status */}
      <section>
        <SectionLabel icon={TrendingUp} title="Task & Feature Status" hint="Distribution across your workstreams" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TaskStatusCards summary={taskStatusQuery.data || {
            pending: 0, in_progress: 0, in_review: 0, completed: 0, blocked: 0, total: 0
          }} />
          <FeatureStatusCards summary={featureStatusQuery.data || {
            planned: 0, in_progress: 0, in_review: 0, completed: 0, archived: 0, total: 0
          }} />
        </div>
      </section>

      {/* Charts */}
      <section>
        <SectionLabel icon={ArrowRight} title="Sprint Analytics" hint="Burndown, velocity, and completion trends" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <BurndownChart data={burndownData} />
          <VelocityChart data={activeSprint ? [{ sprint: activeSprint.sprint_name || 'Current', velocity: activeSprint.velocity || 0, planned: activeSprint.velocity || 0 }] : []} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FeatureProgressPie data={featurePieData} />
          <DailyCompletedTasksChart data={[]} />
        </div>
      </section>

      {/* Team Workload */}
      <section>
        <SectionLabel icon={TeamWorkloadHeatmap === undefined ? TrendingUp : Clock} title="Team Workload" hint="Capacity and balance across the team" />
        <TeamWorkloadHeatmap workload={teamWorkloadQuery.data || []} />
      </section>

      {/* Pending PRs & AI Activity */}
      <section>
        <SectionLabel icon={AlertTriangle} title="Reviews & AI Activity" hint="Pull requests and automation status" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PendingPRsComponent data={pendingPRsQuery.data || { total: 0, by_status: {}, by_repository: {}, prs: [] }} />
          <AIActivitySummaryComponent data={aiActivityQuery.data || {
            total_runs: 0, successful: 0, failed: 0, agents_active: 0, last_run: new Date().toISOString(), summary: 'No AI activity yet', top_agents: []
          }} />
        </div>
      </section>

      {/* Blocker Summary */}
      <section>
        <SectionLabel icon={AlertTriangle} title="Blockers" hint="Impediments requiring attention" />
        <BlockerSummary data={blockers} />
      </section>

      {/* Activity Timeline & Upcoming Deadlines */}
      <section>
        <SectionLabel icon={Clock} title="Recent Activity" hint="Latest changes across the workspace" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityTimeline activities={recentActivityQuery.data || []} />
          <UpcomingDeadlines deadlines={upcomingDeadlinesQuery.data || []} />
        </div>
      </section>

      {/* Recent Decisions */}
      <section>
        <SectionLabel icon={CheckCircle2} title="Recent Decisions" hint="Architecture and planning decisions" />
        <RecentDecisions decisions={recentDecisionsQuery.data || []} />
      </section>
    </div>
  );
}