// src/pages/ReportsPage.tsx

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, TrendingUp, Users, Target, Download, RefreshCw,
  AlertTriangle, FileText,
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';

import { analyticsApi } from '@/api/analytics';
import { projectsApi } from '@/api/projects';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { BurndownChart } from '@/components/dashboard/BurndownChart';
import { VelocityChart } from '@/components/dashboard/VelocityChart';
import { FeatureProgressPie } from '@/components/dashboard/FeatureProgressPie';
import { DailyCompletedTasksChart } from '@/components/dashboard/DailyCompletedTasksChart';
import { BlockerTrendChart } from '@/components/dashboard/BlockerTrendChart';
import { QAPassRateChart } from '@/components/dashboard/QAPassRateChart';
import { TeamWorkloadHeatmap } from '@/components/dashboard/TeamWorkloadHeatmap';

type TimeRange = '7d' | '30d' | '90d' | 'all';

interface OverviewCardProps {
  title: string;
  value: React.ReactNode;
  change?: string;
  icon: React.ElementType;
  accent: string;
  trend?: 'up' | 'down' | 'neutral';
}

function OverviewCard({ title, value, change, icon: Icon, accent, trend }: OverviewCardProps) {
  return (
    <Card className="card glass p-6 hover:shadow-glass-hover hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', accent)}>
          <Icon className="h-5 w-5" />
        </div>
        {change && (
          <span className={cn('text-sm font-semibold', trend === 'up' ? 'text-success-500' : trend === 'down' ? 'text-error-500' : 'text-text-muted')}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {change}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-text-heading mb-1">{value}</div>
      <div className="text-sm font-medium text-text-muted">{title}</div>
    </Card>
  );
}

function ReportSection({ title, description, icon: Icon, accent, children }: {
  title: string;
  description?: string;
  icon: React.ElementType;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', accent)}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-text-heading">{title}</h2>
          {description && <p className="text-xs text-text-muted">{description}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {children}
      </div>
    </section>
  );
}

export function ReportsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [projectId, setProjectId] = useState<string | undefined>(undefined);

  const apiRange = timeRange === 'all' ? '90d' : timeRange;

  const kpisQuery = useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: () => analyticsApi.getDashboardKPIs(),
    retry: false,
  });

  const overviewQuery = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => analyticsApi.getOverview(),
    retry: false,
  });

  const tasksOverTimeQuery = useQuery({
    queryKey: ['analytics', 'tasks-over-time', apiRange],
    queryFn: () => analyticsApi.getTasksOverTime(apiRange),
    retry: false,
  });

  const executionActivityQuery = useQuery({
    queryKey: ['analytics', 'executions', apiRange],
    queryFn: () => analyticsApi.getExecutionActivity(apiRange),
    retry: false,
  });

  const agentUsageQuery = useQuery({
    queryKey: ['analytics', 'agents', apiRange],
    queryFn: () => analyticsApi.getAgentUsage(apiRange),
    retry: false,
  });

  const teamWorkloadQuery = useQuery({
    queryKey: ['team', 'workload'],
    queryFn: () => analyticsApi.getTeamWorkload(),
    retry: false,
  });

  const blockerSummaryQuery = useQuery({
    queryKey: ['blockers', 'summary'],
    queryFn: () => analyticsApi.getBlockerSummary(),
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

  const agentPerfQuery = useQuery({
    queryKey: ['analytics', 'performance', apiRange],
    queryFn: () => analyticsApi.getAgentPerformanceComparison(apiRange),
    retry: false,
  });

  const projectsQuery = useQuery({
    queryKey: ['projects', 'list'],
    queryFn: () => projectsApi.list(),
    retry: false,
  });

  const isLoading =
    kpisQuery.isLoading && overviewQuery.isLoading && tasksOverTimeQuery.isLoading &&
    executionActivityQuery.isLoading && agentUsageQuery.isLoading && teamWorkloadQuery.isLoading &&
    blockerSummaryQuery.isLoading && taskStatusQuery.isLoading && featureStatusQuery.isLoading &&
    agentPerfQuery.isLoading;

  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const timeSeries = useMemo(() => {
    const interval = eachDayOfInterval({
      start: startOfDay(subDays(new Date(), days)),
      end: endOfDay(new Date()),
    });
    return interval.map((date) => ({
      date: format(date, 'MMM d'),
      dateKey: format(date, 'yyyy-MM-dd'),
      tasksCreated: 0,
      tasksCompleted: 0,
      velocity: 0,
      bugs: 0,
    }));
  }, [days]);

  const dailyData = useMemo(() => {
    const points = tasksOverTimeQuery.data ?? [];
    if (points.length > 0) {
      return points.map((p: { date: string; count: number }) => ({
        date: p.date,
        completed: p.count,
        created: p.count,
      }));
    }
    return timeSeries.map((d) => ({ date: d.date, completed: d.tasksCompleted, created: d.tasksCreated }));
  }, [tasksOverTimeQuery.data, timeSeries]);

  const executionData = useMemo(() => {
    const points = executionActivityQuery.data ?? [];
    return points.map((p: { timestamp: string; count: number }) => ({
      date: p.timestamp,
      completed: p.count,
      created: p.count,
    }));
  }, [executionActivityQuery.data]);

  const agentUsage = useMemo(() => agentUsageQuery.data ?? [], [agentUsageQuery.data]);
  const agentPerf = useMemo(() => agentPerfQuery.data ?? [], [agentPerfQuery.data]);
  const workload = useMemo(() => teamWorkloadQuery.data ?? [], [teamWorkloadQuery.data]);
  const projects: any[] = useMemo(() => {
    const d: unknown = projectsQuery.data;
    return Array.isArray(d) ? d : [];
  }, [projectsQuery.data]);

  const filteredProjects = useMemo(() => {
    if (!projectId) return projects;
    return projects.filter((p: any) => p.id === projectId);
  }, [projects, projectId]);

  const kpis = kpisQuery.data;
  const overview = overviewQuery.data;
  const taskStatus = taskStatusQuery.data;
  const featureStatus = featureStatusQuery.data;
  const blockers = blockerSummaryQuery.data;

  const completionRate = taskStatus && taskStatus.total > 0
    ? Math.round((taskStatus.completed / taskStatus.total) * 100)
    : 0;

  const featurePieData = featureStatus
    ? [
        { name: 'Completed', value: featureStatus.completed || 0 },
        { name: 'In Progress', value: featureStatus.in_progress || 0 },
        { name: 'In Review', value: featureStatus.in_review || 0 },
        { name: 'Planned', value: featureStatus.planned || 0 },
        { name: 'Archived', value: featureStatus.archived || 0 },
      ].filter((d) => d.value > 0)
    : [];

  const blockerTrendData = blockers
    ? [{ date: 'Current', open: Number(blockers.by_status?.open ?? 0), in_progress: Number(blockers.by_status?.in_progress ?? 0), resolved: Number(blockers.by_status?.resolved ?? 0) }]
    : [];

  const velocityData = [
    { sprint: 'Current', velocity: kpis?.story_points_completed ?? 0, planned: kpis?.story_points_total ?? 0 },
  ];

  const burndownData = useMemo(() => {
    const total = kpis?.story_points_total ?? 0;
    const done = kpis?.story_points_completed ?? 0;
    if (!total) return [];
    return Array.from({ length: 10 }, (_, i) => ({
      date: `Day ${i + 1}`,
      ideal: Math.max(0, total * (1 - i / 9)),
      actual: Math.max(0, total - (done * (i + 1)) / 10),
    }));
  }, [kpis]);

  const qaData = [
    { feature: 'Sprint QA', passed: kpis?.features_completed ?? 0, failed: blockers?.total ?? 0, total: (kpis?.features_completed ?? 0) + (blockers?.total ?? 0), passRate: 90 },
  ];

  const failedCount = [
    kpisQuery, overviewQuery, tasksOverTimeQuery, executionActivityQuery,
    agentUsageQuery, teamWorkloadQuery, blockerSummaryQuery, taskStatusQuery,
    featureStatusQuery, agentPerfQuery,
  ].filter((q) => q.isError).length;

  const refetchAll = () => {
    kpisQuery.refetch();
    overviewQuery.refetch();
    tasksOverTimeQuery.refetch();
    executionActivityQuery.refetch();
    agentUsageQuery.refetch();
    teamWorkloadQuery.refetch();
    blockerSummaryQuery.refetch();
    taskStatusQuery.refetch();
    featureStatusQuery.refetch();
    agentPerfQuery.refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton variant="title" className="w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-36" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton variant="card" className="h-80" />
          <Skeleton variant="card" className="h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {failedCount > 0 && (
        <div className="rounded-2xl border border-warning-500/30 bg-warning-500/10 p-4 flex flex-wrap items-center gap-3">
          <p className="text-sm text-text-body flex-1 min-w-[200px]">
            Some report sections failed to load ({failedCount}). Showing available data.
          </p>
          <Button size="sm" variant="outline" onClick={refetchAll}>Retry</Button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-heading">Reports</h1>
          <p className="text-text-body mt-1">Project execution speed, team performance, and individual member performance.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)} className="w-40">
            <SelectTrigger><SelectValue placeholder="Time Range" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          {projects.length > 0 && (
            <Select value={projectId ?? 'all'} onValueChange={(v) => setProjectId(v === 'all' ? undefined : v)} className="w-48">
              <SelectTrigger><SelectValue placeholder="All Projects" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {filteredProjects.map((p: any) => (
                  <SelectItem key={String(p.id)} value={String(p.id)}>{String(p.name)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" onClick={() => { kpisQuery.refetch(); tasksOverTimeQuery.refetch(); }} icon={<RefreshCw size={16} />}>Refresh</Button>
          <Button variant="primary" icon={<Download size={16} />}>Export Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <OverviewCard
          title="Project Completion Rate"
          value={`${completionRate}%`}
          icon={Target}
          accent="bg-success-500/10 text-success-500"
        />
        <OverviewCard
          title="Story Points"
          value={`${kpis?.story_points_completed ?? 0}/${kpis?.story_points_total ?? 0}`}
          icon={TrendingUp}
          accent="bg-brand-primary/10 text-brand-primary"
        />
        <OverviewCard
          title="Active Projects"
          value={kpis?.active_projects ?? overview?.total_agents ?? 0}
          icon={Users}
          accent="bg-info-500/10 text-info-500"
        />
        <OverviewCard
          title="Open Blockers"
          value={blockers?.total ?? 0}
          icon={AlertTriangle}
          accent="bg-error-500/10 text-error-500"
        />
      </div>

      <ReportSection
        title="Execution Speed"
        description="Task throughput and sprint burndown"
        icon={TrendingUp}
        accent="bg-brand-primary/10 text-brand-primary"
      >
        <DailyCompletedTasksChart data={dailyData} />
        <BurndownChart data={burndownData} />
        <DailyCompletedTasksChart data={executionData.length > 0 ? executionData : dailyData} title="Execution Activity" />
      </ReportSection>

      <ReportSection
        title="Team Performance"
        description="Velocity, features, and workload"
        icon={Users}
        accent="bg-violet-500/10 text-violet-500"
      >
        <VelocityChart data={velocityData} />
        <FeatureProgressPie data={featurePieData} />
        <TeamWorkloadHeatmap workload={workload} />
      </ReportSection>

      <ReportSection
        title="Quality & Individual Performance"
        description="Blockers, QA, and per-member output"
        icon={BarChart3}
        accent="bg-error-500/10 text-error-500"
      >
        <BlockerTrendChart data={blockerTrendData} />
        <QAPassRateChart data={qaData} />
        <Card className="p-6">
          <h3 className="font-semibold text-text-heading mb-4">Top Contributors</h3>
          {agentUsage.length === 0 && agentPerf.length === 0 ? (
            <p className="text-sm text-text-muted">No individual performance data yet.</p>
          ) : (
            <div className="space-y-3">
              {(agentPerf.length > 0 ? agentPerf : agentUsage).slice(0, 6).map((a: any, i: number) => (
                <div key={String(a.agent_id ?? a.agent_name ?? i)} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-heading truncate">{String(a.agent_name ?? a.agent_id ?? `Member ${i + 1}`)}</p>
                    <p className="text-xs text-text-muted">{Number(a.executions ?? 0)} executions · {Number(a.success_rate ?? 0).toFixed(0)}% success</p>
                  </div>
                  <Badge className="bg-brand-primary/10 text-brand-primary">#{i + 1}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </ReportSection>

      <Card className="p-6 border-2 border-dashed border-brand-primary/30 bg-brand-primary/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-semibold text-text-heading">Export Full Report</h3>
            <p className="text-sm text-text-muted">Generate a comprehensive PDF report with all charts, metrics, and team performance data.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" icon={<FileText size={16} />}>Export PDF</Button>
            <Button variant="outline" icon={<BarChart3 size={16} />}>Export CSV</Button>
            <Button variant="primary" icon={<Download size={16} />}>Generate Full Report</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
