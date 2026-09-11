// src/pages/AgentsPage.tsx
// AI Command Center — manage the 13 automation agents, watch executions live,
// and tune per-agent settings.

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Play, Settings, Loader2, Brain, Bot, TerminalSquare,
  Shield, Zap, Clock, CheckCircle2, AlertTriangle, XCircle, FileText,
  GitBranch, Users, ListChecks, TrendingUp, BookOpen, Bell, Target,
  Lock, Layers, PieChart, Activity, ChevronDown, ChevronRight, RotateCcw,
  Ban, Sparkles, Cpu, Timer, Radio, ArrowRight, Eye
} from 'lucide-react';

import { agentsApi } from '@/api/agents';
import { executionsApi } from '@/api/executions';
import { analyticsApi } from '@/api/analytics';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { Select, SelectItem } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ExecutionActivityChart } from '@/components/dashboard/ExecutionActivityChart';
import { AgentPerformance } from '@/components/dashboard/AgentPerformance';
import { formatNumber, formatPercent, formatDuration, formatRelativeTime, formatDateTime, truncateString } from '@/lib/format';
import { cn } from '@/lib/utils';

// ─── The 13 agent catalog ─────────────────────────────────────
interface AgentSpec {
  type: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const AGENT_CATALOG: AgentSpec[] = [
  { type: 'requirements_analyst', name: 'Requirements Analyst', description: 'Parses, structures, and scores incoming requirements documents.', icon: FileText, color: 'text-blue-500 bg-blue-500/10' },
  { type: 'feature_planner', name: 'Feature Planner', description: 'Plans feature breakdowns, priorities, and acceptance criteria.', icon: Brain, color: 'text-purple-500 bg-purple-500/10' },
  { type: 'task_breakdown', name: 'Task Breakdown', description: 'Splits features into granular, assignable engineering tasks.', icon: ListChecks, color: 'text-green-500 bg-green-500/10' },
  { type: 'task_assignment', name: 'Task Assignment', description: 'Assigns tasks to the best-fit team member based on load.', icon: Users, color: 'text-orange-500 bg-orange-500/10' },
  { type: 'sprint_planner', name: 'Sprint Planner', description: 'Builds sprint backlogs and balances capacity for each cycle.', icon: Target, color: 'text-rose-500 bg-rose-500/10' },
  { type: 'progress_tracker', name: 'Progress Tracker', description: 'Tracks task completion and flags sprint status deviations.', icon: TrendingUp, color: 'text-pink-500 bg-pink-500/10' },
  { type: 'github_review', name: 'GitHub Review', description: 'Reviews pull requests and issues AI recommendations.', icon: GitBranch, color: 'text-gray-500 bg-gray-500/10' },
  { type: 'qa_verification', name: 'QA Verification', description: 'Runs QA guards and verifies completed work against criteria.', icon: Shield, color: 'text-red-500 bg-red-500/10' },
  { type: 'security_review', name: 'Security Review', description: 'Scans changes for security and compliance risks.', icon: Lock, color: 'text-amber-500 bg-amber-500/10' },
  { type: 'documentation', name: 'Documentation', description: 'Keeps docs, knowledge base, and release notes current.', icon: BookOpen, color: 'text-teal-500 bg-teal-500/10' },
  { type: 'notification', name: 'Notification', description: 'Relays sprint, blocker, and review updates to stakeholders.', icon: Bell, color: 'text-yellow-500 bg-yellow-500/10' },
  { type: 'workspace_intelligence', name: 'Workspace Intelligence', description: 'Watches workspace health and suggests optimizations.', icon: Layers, color: 'text-cyan-500 bg-cyan-500/10' },
  { type: 'analytics_reporter', name: 'Analytics Reporter', description: 'Produces execution, velocity, and success-rate reports.', icon: PieChart, color: 'text-indigo-500 bg-indigo-500/10' },
];

const specFor = (agent: any): AgentSpec =>
  AGENT_CATALOG.find((s) => s.type === (agent.agent_type || agent.type)) || {
    type: agent.agent_type || agent.type || 'agent',
    name: agent.name,
    description: agent.description || 'Automation agent',
    icon: Bot,
    color: 'text-brand-primary bg-brand-primary/10',
  };

const EXECUTION_STATUS_STYLE: Record<string, string> = {
  completed: 'bg-success-500/15 text-success-600 border-success-500/20',
  running: 'bg-info-500/15 text-info-600 border-info-500/20',
  queued: 'bg-warning-500/15 text-warning-600 border-warning-500/20',
  failed: 'bg-error-500/15 text-error-600 border-error-500/20',
  cancelled: 'bg-canvas-surface text-text-muted border-canvas-border',
};

const AGENT_STATUS_STYLE: Record<string, string> = {
  active: 'bg-success-500/15 text-success-600 border-success-500/20',
  inactive: 'bg-canvas-surface text-text-muted border-canvas-border',
};

function SectionHeader({ icon, title, hint, children }: { icon: React.ElementType; title: string; hint?: string; children?: React.ReactNode }) {
  const Icon = icon;
  return (
    <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-brand-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-text-heading leading-tight">{title}</h2>
          {hint && <p className="text-xs text-text-muted">{hint}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function StatusDot({ running }: { running: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {running && <span className="absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-75 animate-ping" />}
      <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', running ? 'bg-success-500' : 'bg-text-muted/40')} />
    </span>
  );
}

export function AgentsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [activityTab, setActivityTab] = useState<'all' | 'running' | 'completed' | 'failed'>('all');
  const [activityAgent, setActivityAgent] = useState<string>('all');
  const [activitySearch, setActivitySearch] = useState('');
  const [settingsAgent, setSettingsAgent] = useState<any>(null);
  const [logsExecution, setLogsExecution] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expansionOpen, setExpansionOpen] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    agent_type: 'requirements_analyst',
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 4096,
    tools: [],
    timeout_seconds: 60,
    retry_policy: { max_retries: 3 },
  });

  // ── Queries ────────────────────────────────────────────────
  const agentsQuery = useQuery({
    queryKey: ['agents', 'command-center', { search, statusFilter }],
    queryFn: () =>
      agentsApi.list({
        search: search || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 100,
        sort: '-created_at',
      }),
    retry: false,
  });

  const overviewQuery = useQuery({
    queryKey: ['agents', 'overview'],
    queryFn: () => analyticsApi.getOverview(),
    retry: false,
  });

  const executionsQuery = useQuery({
    queryKey: ['executions', 'command-center'],
    queryFn: () => executionsApi.list({ limit: 100, sort: '-created_at' }),
    retry: false,
    refetchInterval: (query: any) => {
      const d = query?.state?.data;
      const list = Array.isArray(d) ? d : d?.items;
      return Array.isArray(list) && list.some((e: any) => e.status === 'running' || e.status === 'queued') ? 8000 : false;
    },
  });

  const agentUsageQuery = useQuery({
    queryKey: ['agents', 'usage'],
    queryFn: () => analyticsApi.getAgentUsage('7d'),
    retry: false,
  });

  // ── Mutations ──────────────────────────────────────────────
  const runMutation = useMutation({
    mutationFn: (id: string) => agentsApi.execute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions', 'command-center'] });
      addToast({ type: 'success', title: 'Execution started', description: 'The agent is now working on the task.' });
    },
    onError: (e: any) => addToast({ type: 'error', title: 'Failed to start execution', description: e.message }),
  });

  const runAllMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(ids.map((id) => agentsApi.execute(id)));
      return { total: ids.length, succeeded: results.filter((r) => r.status === 'fulfilled').length };
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['executions', 'command-center'] });
      addToast({
        type: 'success',
        title: 'Run All Agents',
        description: `${res.succeeded} of ${res.total} agents kicked off.`,
      });
    },
    onError: (e: any) => addToast({ type: 'error', title: 'Run All failed', description: e.message }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) => agentsApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agents', 'overview'] });
      addToast({ type: 'success', title: 'Agent status updated' });
    },
    onError: (e: any) => addToast({ type: 'error', title: 'Failed to update status', description: e.message }),
  });

  const saveSettingsMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => agentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setSettingsAgent(null);
      addToast({ type: 'success', title: 'Settings saved', description: 'Agent configuration updated.' });
    },
    onError: (e: any) => addToast({ type: 'error', title: 'Failed to save settings', description: e.message }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => agentsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setShowCreateDialog(false);
      addToast({ type: 'success', title: 'Agent created' });
    },
    onError: (e: any) => addToast({ type: 'error', title: 'Failed to create agent', description: e.message }),
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => executionsApi.retry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions', 'command-center'] });
      addToast({ type: 'success', title: 'Execution queued for retry' });
    },
    onError: (e: any) => addToast({ type: 'error', title: 'Retry failed', description: e.message }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => executionsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executions', 'command-center'] });
      addToast({ type: 'success', title: 'Execution cancelled' });
    },
    onError: (e: any) => addToast({ type: 'error', title: 'Cancel failed', description: e.message }),
  });

  // ── Derived data ───────────────────────────────────────────
  const agents = useMemo(() => {
    const d = agentsQuery.data;
    return Array.isArray(d) ? d : (d?.items || []);
  }, [agentsQuery.data]);
  const agentsLoading = agentsQuery.isLoading;
  const agentsError = agentsQuery.error;

  const executions = useMemo(() => {
    const d = executionsQuery.data;
    return Array.isArray(d) ? d : (d?.items || []);
  }, [executionsQuery.data]);
  const overview = overviewQuery.data;
  const activeAgents = agents.filter((a) => a.status === 'active');
  const runningNow = executions.filter((e) => e.status === 'running' || e.status === 'queued');
  const todayExecutions = executions.filter((e) => {
    const d = new Date(e.created_at);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }).length;
  const failedToday = executions.filter(
    (e) => e.status === 'failed' && new Date(e.created_at).toDateString() === new Date().toDateString()
  ).length;
  const successRate = overview?.success_rate ?? (executions.length
    ? (executions.filter((e) => e.status === 'completed').length / executions.length) * 100
    : 0);
  const avgDuration = executions.filter((e) => e.duration).length
    ? executions.filter((e) => e.duration).reduce((acc, e) => acc + (e.duration || 0), 0) / executions.filter((e) => e.duration).length
    : 0;
  const lastRun = executions[0];

  const lastRunByAgent = useMemo(() => {
    const map: Record<string, any> = {};
    for (const e of executions) {
      if (!map[e.agent_id] || new Date(e.created_at) > new Date(map[e.agent_id].created_at)) map[e.agent_id] = e;
    }
    return map;
  }, [executions]);

  const usageByAgent = useMemo(() => {
    const map: Record<string, any> = {};
    for (const u of agentUsageQuery.data || []) map[u.agent_id] = u;
    return map;
  }, [agentUsageQuery.data]);

  const filteredActivity = useMemo(() => {
    return executions
      .filter((e) => (activityTab === 'all' ? true : e.status === activityTab))
      .filter((e) => (activityAgent === 'all' ? true : e.agent_id === activityAgent))
      .filter((e) =>
        activitySearch
          ? `${e.agent_name} ${e.task_name}`.toLowerCase().includes(activitySearch.toLowerCase())
          : true
      )
      .slice(0, 20);
  }, [executions, activityTab, activityAgent, activitySearch]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Excluded query that previously used SystemHealth — kept for loading gate
  const sectionLoading = agentsLoading || executionsQuery.isLoading;

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-brand-primary/10 text-brand-primary border-brand-primary/25">
              <Sparkles className="h-3 w-3" /> AI Command Center
            </Badge>
          </div>
          <h1 className="font-heading text-3xl font-bold text-text-heading">AI Command Center</h1>
          <p className="text-text-body mt-1 max-w-2xl">
            Monitor, run, and tune your workspace of automation agents. Automation services only — no coding agents.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <StatusDot running={runningNow.length > 0} />
          <span className="text-xs text-text-muted mr-2">
            {runningNow.length > 0 ? `${runningNow.length} running` : 'all idle'}
          </span>
          <Button variant="outline" onClick={() => scrollToSection('agents-activity')} icon={<Activity className="h-4 w-4" />}>
            View Activity
          </Button>
          <Button
            variant="default"
            disabled={runAllMutation.isPending || activeAgents.length === 0}
            onClick={() => {
              if (activeAgents.length === 0) {
                addToast({ type: 'info', title: 'No active agents', description: 'Enable at least one agent first.' });
                return;
              }
              runAllMutation.mutate(activeAgents.map((a) => a.id));
            }}
            icon={runAllMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            className="bg-brand-primary text-white hover:bg-brand-primary-hover shadow-glow-blue"
          >
            Run All Agents
          </Button>
          <Button variant="outline" onClick={() => { setFormData({ name: '', description: '', agent_type: 'requirements_analyst', model: 'gpt-4', temperature: 0.7, max_tokens: 4096, tools: [], timeout_seconds: 60, retry_policy: { max_retries: 3 } }); setShowCreateDialog(true); }} icon={<Plus size={16} />}>
            New Agent
          </Button>
        </div>
      </div>

      {/* Section 1 — System Overview */}
      <section>
        <SectionHeader icon={Cpu} title="System Overview" hint="Live health of the agent fleet" />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <OverviewStat label="Active Agents" value={overview?.active_agents ?? activeAgents.length} sub={`of ${overview?.total_agents ?? agents.length} total`} accent="text-success-600" icon={Zap} />
          <OverviewStat label="Running Now" value={runningNow.length} sub={runningNow.length ? 'executing tasks' : 'all idle'} accent={runningNow.length ? 'text-info-600' : 'text-text-muted'} icon={Activity} />
          <OverviewStat label="Today's Executions" value={formatNumber(todayExecutions)} sub={lastRun ? `last ${formatRelativeTime(lastRun.created_at)}` : 'no runs yet'} accent="text-brand-primary" icon={Timer} />
          <OverviewStat label="Avg Exec Time" value={avgDuration > 0 ? formatDuration(avgDuration) : '—'} sub="across recent executions" accent="text-indigo-500" icon={Clock} />
          <OverviewStat label="Success Rate" value={formatPercent(successRate)} sub="last 7 days" accent={successRate >= 90 ? 'text-success-600' : 'text-warning-600'} icon={CheckCircle2} />
          <OverviewStat label="Failures" value={formatNumber(failedToday)} sub="today" accent={failedToday ? 'text-error-500' : 'text-text-muted'} icon={AlertTriangle} />
        </div>
      </section>

      {/* Section 2 — Agent Grid */}
      <section id="agents-grid">
        <SectionHeader icon={Bot} title="Agent Fleet" hint="Thirteen purpose-built automation agents" >
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Input
                placeholder="Search agents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-56"
                aria-label="Search agents"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={15} />
            </div>
            <Select value={statusFilter} onChange={(v) => setStatusFilter(v as any)}>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </Select>
          </div>
        </SectionHeader>

        {sectionLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="card" className="h-64" />)}
          </div>
        ) : agentsError ? (
          <EmptyState
            title="Failed to load agents"
            description={agentsError instanceof Error ? agentsError.message : 'Unknown error'}
            onRetry={() => { agentsQuery.refetch(); }}
          />
        ) : agents.length === 0 ? (
          <EmptyState
            title={search ? 'No matching agents' : 'No agents yet'}
            description={search ? 'Try adjusting your search' : 'Create your first automation agent to get started'}
            action={<Button onClick={() => { setFormData({ name: '', description: '', agent_type: 'requirements_analyst', model: 'gpt-4', temperature: 0.7, max_tokens: 4096, tools: [], timeout_seconds: 60, retry_policy: { max_retries: 3 } }); setShowCreateDialog(true); }} icon={<Plus size={16} />}>Create Agent</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {agents.map((agent) => {
              const spec = specFor(agent);
              const isActive = agent.status === 'active';
              const usage = usageByAgent[agent.id];
              const lastExec = lastRunByAgent[agent.id];
              const Icon = spec.icon;
              return (
                <Card key={agent.id} glass className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glass-hover">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-primary/60 via-info-500/50 to-brand-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0', spec.color)}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-text-heading truncate">{spec.name}</h3>
                          <p className="text-xs text-text-muted truncate">{truncateString(agent.description || spec.description, 52)}</p>
                        </div>
                      </div>
                      <Badge className={AGENT_STATUS_STYLE[agent.status] || 'bg-canvas-surface text-text-muted border-canvas-border'}>
                        <span className={cn('w-1.5 h-1.5 rounded-full mr-1', isActive ? 'bg-success-500' : 'bg-text-muted/50')} />
                        {agent.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-canvas-surface/60 border border-canvas-border">
                        <p className="text-base font-semibold text-text-heading">{usage?.executions ?? agent.execution_count ?? 0}</p>
                        <p className="text-[10px] uppercase tracking-wider text-text-muted mt-0.5">Runs</p>
                      </div>
                      <div className="p-2 rounded-xl bg-canvas-surface/60 border border-canvas-border">
                        <p className={cn('text-base font-semibold', (usage?.success_rate ?? agent.success_rate) >= 90 ? 'text-success-600' : 'text-warning-600')}>
                          {formatPercent(usage?.success_rate ?? agent.success_rate)}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-text-muted mt-0.5">Success</p>
                      </div>
                      <div className="p-2 rounded-xl bg-canvas-surface/60 border border-canvas-border">
                        <p className="text-base font-semibold text-text-heading">{formatDuration(usage?.avg_duration ?? agent.avg_duration)}</p>
                        <p className="text-[10px] uppercase tracking-wider text-text-muted mt-0.5">Avg Time</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-text-muted">
                      <span className="flex items-center gap-1.5">
                        <Radio className="h-3 w-3" />
                        Last run: {lastExec ? formatRelativeTime(lastExec.created_at) : 'never'}
                      </span>
                      <span className="font-mono">{agent.model || 'gpt-4'}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-canvas-border">
                      <Button
                        size="sm"
                        className="flex-1 bg-brand-primary text-white hover:bg-brand-primary-hover"
                        disabled={runMutation.isPending}
                        onClick={() => runMutation.mutate(agent.id)}
                        icon={runMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                      >
                        Run Now
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setSettingsAgent(agent); }}
                        icon={<Settings className="h-3.5 w-3.5" />}
                      >
                        Settings
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setActivityAgent(agent.id); setActivityTab('all'); scrollToSection('agents-activity'); }}
                        icon={<Activity className="h-3.5 w-3.5" />}
                        aria-label="View activity"
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 3 — Live Execution Pipeline */}
      <section id="agents-pipeline">
        <SectionHeader icon={TerminalSquare} title="Execution Pipeline" hint="Queued → working → results, live">
          {runningNow.length > 0 && (
            <Badge className="bg-info-500/15 text-info-600 border-info-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-info-500 animate-pulse mr-1" />
              {runningNow.length} in flight
            </Badge>
          )}
        </SectionHeader>

        {runningNow.length === 0 && executions.length === 0 ? (
          <div className="card p-10 text-center">
            <TerminalSquare className="mx-auto h-10 w-10 text-text-muted mb-3" />
            <p className="text-text-body">No executions yet. Hit "Run All Agents" or "Run Now" to kick off the pipeline.</p>
          </div>
        ) : (
          <Card glass className="overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
                {['queued', 'running', 'completed', 'failed', 'cancelled'].map((stage, idx) => (
                  <div key={stage} className="flex items-center gap-2 flex-shrink-0">
                    {idx > 0 && <ArrowRight className="h-4 w-4 text-text-muted/60" />}
                    <span className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium border',
                      stage === 'running' && runningNow.some((e) => e.status === 'running') ? 'bg-info-500/15 text-info-600 border-info-500/25' : 'bg-canvas-surface text-text-muted border-canvas-border'
                    )}>
                      {stage}
                    </span>
                  </div>
                ))}
              </div>

              {runningNow.length > 0 ? (
                <div className="space-y-3">
                  {runningNow.map((e) => (
                    <div key={e.id} className="flex items-center justify-between gap-4 p-3 rounded-xl border border-canvas-border bg-canvas-surface/50">
                      <div className="flex items-center gap-3 min-w-0">
                        {e.status === 'running' ? (
                          <Loader2 className="h-5 w-5 text-info-500 animate-spin flex-shrink-0" />
                        ) : (
                          <Clock className="h-5 w-5 text-warning-500 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-heading truncate">{e.agent_name}</p>
                          <p className="text-xs text-text-muted truncate">{e.task_name || 'No task'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-xs text-text-muted flex-shrink-0">
                        <span className="uppercase tracking-wide">{e.status}</span>
                        {e.started_at && <span>{formatRelativeTime(e.started_at)}</span>}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={cancelMutation.isPending}
                          onClick={() => cancelMutation.mutate(e.id)}
                          icon={<Ban className="h-3.5 w-3.5" />}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-canvas-border">
                  <CheckCircle2 className="h-5 w-5 text-success-500" />
                  <p className="text-sm text-text-body">Pipeline idle — nothing queued or running right now.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      {/* Section 4 — Activity Feed + History */}
      <section id="agents-activity">
        <SectionHeader icon={Activity} title="Activity & Executions" hint="Filter by status, agent, or search">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Input
                placeholder="Search executions..."
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                className="pl-9 w-52"
                aria-label="Search executions"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={15} />
            </div>
            <Select value={activityAgent} onChange={(v) => { setActivityAgent(v); }}>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>{specFor(a).name}</SelectItem>
              ))}
            </Select>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-canvas-surface border border-canvas-border">
              {(['all', 'running', 'completed', 'failed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActivityTab(tab)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200',
                    activityTab === tab ? 'bg-brand-primary text-white shadow-glow-blue' : 'text-text-muted hover:text-text-heading'
                  )}
                >
                  {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </SectionHeader>

        {filteredActivity.length === 0 ? (
          <EmptyState
            icon={<Activity className="h-10 w-10" />}
            title="No executions match"
            description="Try a different filter, or run an agent to see activity here."
          />
        ) : (
          <Card glass className="overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-canvas-border">
                {filteredActivity.map((exec) => {
                  const expanded = expansionOpen[exec.id];
                  return (
                    <div key={exec.id} className="transition-colors duration-200 hover:bg-canvas-surface/40">
                      <div className="flex items-center justify-between gap-4 px-5 py-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', EXECUTION_STATUS_STYLE[exec.status] || 'bg-canvas-surface')}>
                            {exec.status === 'completed' ? <CheckCircle2 className="h-5 w-5" /> : null}
                            {exec.status === 'running' ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                            {exec.status === 'queued' ? <Clock className="h-5 w-5" /> : null}
                            {exec.status === 'failed' ? <XCircle className="h-5 w-5" /> : null}
                            {exec.status === 'cancelled' ? <Ban className="h-5 w-5" /> : null}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-heading truncate">{exec.agent_name}</p>
                            <p className="text-xs text-text-muted truncate">{exec.task_name || 'No task attached'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="hidden md:block text-right">
                            <p className="text-xs text-text-muted">{formatDateTime(exec.created_at)}</p>
                            <p className="text-xs font-mono text-text-muted">{formatDuration(exec.duration)}</p>
                          </div>
                          <Badge className={EXECUTION_STATUS_STYLE[exec.status] || 'bg-canvas-surface text-text-muted border-canvas-border'}>
                            {exec.status}
                          </Badge>
                          <div className="relative">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setLogsExecution(exec)} icon={<Eye className="h-4 w-4" />}>
                                View Logs
                              </DropdownMenuItem>
                              {(exec.status === 'failed' || exec.status === 'cancelled') && (
                                <DropdownMenuItem onClick={() => retryMutation.mutate(exec.id)} icon={<RotateCcw className="h-4 w-4" />}>
                                  Retry
                                </DropdownMenuItem>
                              )}
                              {(exec.status === 'running' || exec.status === 'queued') && (
                                <DropdownMenuItem onClick={() => cancelMutation.mutate(exec.id)} icon={<Ban className="h-4 w-4" />}>
                                  Cancel
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => setExpansionOpen((prev) => ({ ...prev, [exec.id]: !prev[exec.id] }))} icon={expanded ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}>
                                {expanded ? 'Collapse' : 'Expand Details'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        </div>
                      </div>

                      {expanded && (
                        <div className="px-5 pb-4 animate-fade-in">
                          <div className="p-4 rounded-xl bg-canvas-surface/60 border border-canvas-border">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                              <div>
                                <p className="text-text-muted mb-0.5">Execution ID</p>
                                <p className="font-mono text-text-heading">{exec.id.slice(0, 16)}…</p>
                              </div>
                              <div>
                                <p className="text-text-muted mb-0.5">Agent</p>
                                <p className="text-text-heading">{exec.agent_name}</p>
                              </div>
                              <div>
                                <p className="text-text-muted mb-0.5">Task</p>
                                <p className="text-text-heading truncate">{exec.task_name || '—'}</p>
                              </div>
                              <div>
                                <p className="text-text-muted mb-0.5">Duration</p>
                                <p className="font-mono text-text-heading">{formatDuration(exec.duration)}</p>
                              </div>
                            </div>
                            {exec.timeline && exec.timeline.length > 0 && (
                              <div className="mt-4 space-y-2">
                                {exec.timeline.map((step: any, idx: number) => (
                                  <div key={step.id || idx} className="flex items-center gap-3">
                                    {step.status === 'completed' ? <CheckCircle2 className="h-4 w-4 text-success-500" /> : step.status === 'failed' ? <XCircle className="h-4 w-4 text-error-500" /> : <Loader2 className="h-4 w-4 text-info-500 animate-spin" />}
                                    <span className="text-xs text-text-body">{step.label}</span>
                                    {step.duration != null && <span className="text-xs text-text-muted font-mono ml-auto">{formatDuration(step.duration)}</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                            {exec.error?.message && (
                              <div className="mt-3 p-3 rounded-lg bg-error-500/10 border border-error-500/20 text-xs text-error-600">
                                {exec.error.message}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Section 5 — Performance Analytics */}
      <section id="agents-performance">
        <SectionHeader icon={PieChart} title="Performance Analytics" hint="Execution throughput and agent effectiveness" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExecutionActivityChart />
          <AgentPerformance />
        </div>
      </section>

      {/* Settings Drawer */}
      <Dialog open={!!settingsAgent} onOpenChange={(open) => !open && setSettingsAgent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agent Settings — {settingsAgent?.name}</DialogTitle>
            <DialogDescription>Tune execution behavior. Changes are saved to the agent.</DialogDescription>
          </DialogHeader>
          {settingsAgent && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveSettingsMutation.mutate({
                  id: settingsAgent.id,
                  data: {
                    model: settingsAgent.model,
                    temperature: settingsAgent.temperature,
                    max_tokens: settingsAgent.max_tokens,
                    timeout_seconds: settingsAgent.timeout_seconds,
                    tools: settingsAgent.tools,
                  },
                });
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="label">Model</label>
                  <Select value={settingsAgent.model || 'gpt-4'} onChange={(v) => setSettingsAgent({ ...settingsAgent, model: v })}>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                    <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                    <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="label">Temperature</label>
                  <Input type="number" step="0.1" min="0" max="2" value={settingsAgent.temperature ?? 0.7} onChange={(e) => setSettingsAgent({ ...settingsAgent, temperature: parseFloat(e.target.value) || 0.7 })} />
                </div>
                <div className="space-y-2">
                  <label className="label">Max Tokens</label>
                  <Input type="number" value={settingsAgent.max_tokens ?? 4096} onChange={(e) => setSettingsAgent({ ...settingsAgent, max_tokens: parseInt(e.target.value) || 4096 })} />
                </div>
                <div className="space-y-2">
                  <label className="label">Timeout (seconds)</label>
                  <Input type="number" value={settingsAgent.timeout_seconds ?? 60} onChange={(e) => setSettingsAgent({ ...settingsAgent, timeout_seconds: parseInt(e.target.value) || 60 })} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="label">Connected Tools (comma separated)</label>
                  <Input value={(settingsAgent.tools || []).join(', ')} onChange={(e) => setSettingsAgent({ ...settingsAgent, tools: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) })} />
                </div>
                <div className="space-y-2">
                  <label className="label">Max Retries</label>
                  <Input type="number" min="0" max="10" value={settingsAgent.retry_policy?.max_retries ?? 3} onChange={(e) => setSettingsAgent({ ...settingsAgent, retry_policy: { max_retries: parseInt(e.target.value) || 3 } })} />
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-canvas-border bg-canvas-surface/60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-heading">Enabled</p>
                    <p className="text-xs text-text-muted">{settingsAgent.status === 'active' ? 'This agent is active and can be run.' : 'This agent is paused.'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleStatusMutation.mutate({ id: settingsAgent.id, status: settingsAgent.status === 'active' ? 'inactive' : 'active' })}
                    className={cn('relative inline-flex items-center h-7 w-12 rounded-full transition-colors duration-300', settingsAgent.status === 'active' ? 'bg-success-500' : 'bg-canvas-border')}
                    aria-pressed={settingsAgent.status === 'active'}
                    aria-label="Toggle agent status"
                  >
                    <span className={cn('inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300', settingsAgent.status === 'active' ? 'translate-x-[26px]' : 'translate-x-1')} />
                  </button>
                </div>
              </div>
            </form>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSettingsAgent(null)}>Cancel</Button>
            <Button
              type="submit"
              disabled={saveSettingsMutation.isPending}
              onClick={() => {
                if (settingsAgent) {
                  saveSettingsMutation.mutate({
                    id: settingsAgent.id,
                    data: {
                      model: settingsAgent.model,
                      temperature: settingsAgent.temperature,
                      max_tokens: settingsAgent.max_tokens,
                      timeout_seconds: settingsAgent.timeout_seconds,
                      tools: settingsAgent.tools,
                    },
                  });
                }
              }}
              icon={saveSettingsMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            >
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs Drawer */}
      <Dialog open={!!logsExecution} onOpenChange={(open) => !open && setLogsExecution(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Execution Logs</DialogTitle>
            <DialogDescription>
              {logsExecution?.agent_name} · {logsExecution?.task_name || 'No task'} ·{' '}
              <span className="capitalize">{logsExecution?.status}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-background border border-canvas-border p-4 font-mono text-xs text-text-body space-y-2 max-h-[50vh] overflow-y-auto">
            {(logsExecution?.logs && logsExecution.logs.length > 0) ? (
              logsExecution.logs.map((log: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="text-text-muted flex-shrink-0">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : idx.toString().padStart(2, '0')}</span>
                  <span className={cn(
                    'flex-shrink-0',
                    log.level === 'error' ? 'text-error-500' : log.level === 'warn' ? 'text-warning-600' : log.level === 'debug' ? 'text-text-muted' : 'text-text-heading'
                  )}>
                    [{log.level?.toUpperCase() || 'INFO'}]
                  </span>
                  <span className="break-words">{log.message || log.content || JSON.stringify(log)}</span>
                </div>
              ))
            ) : (
              <p className="text-text-muted">
                No structured log lines for this execution.
                {logsExecution?.error?.message ? ` Error: ${logsExecution.error.message}` : ''}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLogsExecution(null)}>Close</Button>
            {logsExecution?.id && <Button onClick={() => navigate(`/executions/${logsExecution.id}`)}>Open Full Details</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Agent Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Agent</DialogTitle>
            <DialogDescription>Add a new automation agent to the command center.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ name: formData.name, description: formData.description, type: formData.agent_type, status: 'active', capabilities: [], tools: formData.tools, configuration: {} }); }} className="space-y-6">
            <div className="space-y-2">
              <label className="label">Name</label>
              <Input placeholder="Agent name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="label">Description</label>
              <Textarea placeholder="Agent description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label">Agent Type</label>
                <Select value={formData.agent_type} onChange={(v) => setFormData({ ...formData, agent_type: v })}>
                  {AGENT_CATALOG.map((s) => (
                    <SelectItem key={s.type} value={s.type}>{s.name}</SelectItem>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="label">Model</label>
                <Select value={formData.model} onChange={(v) => setFormData({ ...formData, model: v })}>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                  <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                  <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="label">Temperature</label>
                <Input type="number" step="0.1" min="0" max="2" value={formData.temperature} onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) || 0.7 })} />
              </div>
              <div className="space-y-2">
                <label className="label">Max Tokens</label>
                <Input type="number" value={formData.max_tokens} onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) || 4096 })} />
              </div>
              <div className="space-y-2">
                <label className="label">Timeout (s)</label>
                <Input type="number" value={formData.timeout_seconds} onChange={(e) => setFormData({ ...formData, timeout_seconds: parseInt(e.target.value) || 60 })} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="label">Tools (comma separated)</label>
              <Input placeholder="tool1, tool2" value={formData.tools?.join(', ') || ''} onChange={(e) => setFormData({ ...formData, tools: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })} />
            </div>
          </form>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending} onClick={() => createMutation.mutate({ name: formData.name, description: formData.description, type: formData.agent_type, status: 'active', capabilities: [], tools: formData.tools, configuration: {} })} icon={createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}>
              Create Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OverviewStat({ label, value, sub, accent, icon: Icon }: { label: string; value: string | number; sub?: string; accent: string; icon: React.ElementType }) {
  return (
    <Card glass className="p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glass-hover">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase tracking-wider text-text-muted font-medium">{label}</span>
        <Icon className={cn('h-4 w-4', accent)} />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-text-muted mt-0.5 truncate">{sub}</p>}
    </Card>
  );
}