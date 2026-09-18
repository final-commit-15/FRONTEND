// src/pages/DashboardPage.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics';
import { teamMembersApi } from '@/api/team_members';
import { projectsApi } from '@/api/projects';
import { tasksApi } from '@/api/tasks';
import { requirementsApi } from '@/api/requirements';
import { useAuth } from '@/hooks/useAuth';
import { useSprintStore } from '@/store/sprintStore';
import { useToast } from '@/hooks/useToast';

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
import { ModelTokenStatus } from '@/components/dashboard/ModelTokenStatus';
import { ProviderErrorBoundary } from '@/components/dashboard/ProviderErrorBoundary';
import { ProviderHealthCards } from '@/components/dashboard/ProviderHealthCards';
import { BurndownChart } from '@/components/dashboard/BurndownChart';
import { VelocityChart } from '@/components/dashboard/VelocityChart';
import { FeatureProgressPie } from '@/components/dashboard/FeatureProgressPie';
import { DailyCompletedTasksChart } from '@/components/dashboard/DailyCompletedTasksChart';
import { BlockerTrendChart } from '@/components/dashboard/BlockerTrendChart';
import { QAPassRateChart } from '@/components/dashboard/QAPassRateChart';
import { SprintHealthIndicator } from '@/components/dashboard/SprintHealthIndicator';
import { TrendingUp, Clock, CheckCircle2, AlertTriangle, ArrowRight, Plus } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

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
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [activityText, setActivityText] = useState('');
  const [deadlineTitle, setDeadlineTitle] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [decisionTitle, setDecisionTitle] = useState('');
  const [decisionReason, setDecisionReason] = useState('');

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

  const projectsQuery = useQuery({
    queryKey: ['projects', 'dashboard-list'],
    queryFn: () => projectsApi.list(),
    retry: false,
  });
  const dashboardProjects: any[] = Array.isArray(projectsQuery.data) ? projectsQuery.data : [];
  const selectedProject = dashboardProjects.find((p: any) => String(p.id) === selectedProjectId);

  const logActivityMutation = useMutation({
    mutationFn: (text: string) =>
      requirementsApi.createDecision({ title: text.slice(0, 80), description: text, reason: 'Logged from dashboard activity' } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity', 'recent'] });
      queryClient.invalidateQueries({ queryKey: ['decisions', 'recent'] });
      setActivityText('');
      addToast({ type: 'success', title: 'Activity logged' });
    },
    onError: (e: any) => addToast({ type: 'error', title: 'Failed to log activity', description: e.message }),
  });

  const addDeadlineMutation = useMutation({
    mutationFn: ({ title, date }: { title: string; date: string }) =>
      tasksApi.create({ title, deadline: new Date(date).toISOString() } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines', 'upcoming'] });
      setDeadlineTitle('');
      setDeadlineDate('');
      addToast({ type: 'success', title: 'Deadline added' });
    },
    onError: (e: any) => addToast({ type: 'error', title: 'Failed to add deadline', description: e.message }),
  });

  const addDecisionMutation = useMutation({
    mutationFn: ({ title, reason }: { title: string; reason: string }) =>
      requirementsApi.createDecision({ title, description: reason, reason } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions', 'recent'] });
      setDecisionTitle('');
      setDecisionReason('');
      addToast({ type: 'success', title: 'Decision recorded' });
    },
    onError: (e: any) => addToast({ type: 'error', title: 'Failed to record decision', description: e.message }),
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

      {/* Model token availability */}
      <section>
        <SectionLabel icon={CheckCircle2} title="AI Model Tokens" hint="Which models have tokens now vs running out" />
        <ProviderErrorBoundary>
          <ModelTokenStatus />
        </ProviderErrorBoundary>
      </section>

      {/* Provider Health Cards */}
      <section>
        <SectionLabel icon={CheckCircle2} title="AI Provider Health" hint="Live status, models, latency, and API keys" />
        <ProviderHealthCards />
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

      {/* Project header: project, client, activity, members, progress */}
      <section>
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-text-heading">
                {selectedProject ? String(selectedProject.name) : 'Select a project'}
              </h2>
              <p className="text-sm text-text-muted">
                {selectedProject
                  ? `Client: ${String(selectedProject.client_name ?? '—')}${selectedProject.organization_name ? ` · ${String(selectedProject.organization_name)}` : ''}`
                  : 'Pick a project to see client, activity, members and progress.'}
              </p>
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-text-muted">
                <span>Total activity: {(recentActivityQuery.data ?? []).length}</span>
                <span>Members: {(teamMembersQuery.data as any[] ?? []).length}</span>
                <span>Progress: {Math.round(sprintProgressQuery.data?.completion ?? 0)}%</span>
              </div>
            </div>
            <div className="w-full md:w-72">
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger><SelectValue placeholder="Choose project" /></SelectTrigger>
                <SelectContent>
                  {dashboardProjects.map((p: any) => (
                    <SelectItem key={String(p.id)} value={String(p.id)}>{String(p.name)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      </section>

      {/* Activity Timeline & Upcoming Deadlines (writable) */}
      <section>
        <SectionLabel icon={Clock} title="Recent Activity" hint="Latest changes across the workspace — you can log an update below" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <ActivityTimeline activities={recentActivityQuery.data || []} />
            <Card className="p-4">
              <h4 className="text-sm font-semibold text-text-heading mb-2">Log activity</h4>
              <div className="flex gap-2">
                <Input placeholder="What happened? e.g., Client approved login flow" value={activityText} onChange={(e) => setActivityText(e.target.value)} />
                <Button size="sm" disabled={!activityText.trim() || logActivityMutation.isPending} onClick={() => logActivityMutation.mutate(activityText.trim())} icon={<Plus size={14} />}>
                  Add
                </Button>
              </div>
            </Card>
          </div>
          <div className="space-y-4">
            <UpcomingDeadlines deadlines={upcomingDeadlinesQuery.data || []} />
            <Card className="p-4">
              <h4 className="text-sm font-semibold text-text-heading mb-2">Add deadline</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input placeholder="Deadline title" value={deadlineTitle} onChange={(e) => setDeadlineTitle(e.target.value)} />
                <Input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} />
              </div>
              <Button size="sm" className="mt-2" disabled={!deadlineTitle.trim() || !deadlineDate || addDeadlineMutation.isPending} onClick={() => addDeadlineMutation.mutate({ title: deadlineTitle.trim(), date: deadlineDate })} icon={<Plus size={14} />}>
                Add deadline
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Decisions (writable) */}
      <section>
        <SectionLabel icon={CheckCircle2} title="Recent Decisions" hint="Architecture and planning decisions — record a new one below" />
        <RecentDecisions decisions={recentDecisionsQuery.data || []} />
        <Card className="p-4 mt-4">
          <h4 className="text-sm font-semibold text-text-heading mb-2">Record decision</h4>
          <div className="grid grid-cols-1 gap-2">
            <Input placeholder="Decision title" value={decisionTitle} onChange={(e) => setDecisionTitle(e.target.value)} />
            <Textarea placeholder="Why was this decided?" value={decisionReason} onChange={(e) => setDecisionReason(e.target.value)} rows={2} />
          </div>
          <Button size="sm" className="mt-2" disabled={!decisionTitle.trim() || addDecisionMutation.isPending} onClick={() => addDecisionMutation.mutate({ title: decisionTitle.trim(), reason: decisionReason.trim() || 'Recorded from dashboard' })} icon={<Plus size={14} />}>
            Record decision
          </Button>
        </Card>
      </section>
    </div>
  );
}