// src/pages/MonitorPage.tsx

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users, AlertTriangle, TrendingUp, Clock, Target,
  CheckCircle2, RefreshCw, Plus,
} from 'lucide-react';
import { format } from 'date-fns';

import { analyticsApi } from '@/api/analytics';
import { teamMembersApi } from '@/api/team_members';
import { tasksApi } from '@/api/tasks';
import { requirementsApi } from '@/api/requirements';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { TeamWorkloadHeatmap } from '@/components/dashboard/TeamWorkloadHeatmap';
import { UpcomingDeadlines } from '@/components/dashboard/UpcomingDeadlines';
import { SprintHealthIndicator } from '@/components/dashboard/SprintHealthIndicator';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-500/20 text-gray-400',
  medium: 'bg-blue-500/20 text-blue-400',
  high: 'bg-orange-500/20 text-orange-400',
  critical: 'bg-red-500/20 text-red-400',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-500/20 text-red-400 border-red-500/20',
  in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
  resolved: 'bg-green-500/20 text-green-400 border-green-500/20',
};

interface MemberProgress {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role: string;
  department: string;
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  velocity: number;
}

function BlockerSummaryCard({ blockers }: { blockers: any[] }) {
  const critical = blockers.filter((b: any) => b.priority === 'critical').length;
  const high = blockers.filter((b: any) => b.priority === 'high').length;
  const open = blockers.filter((b: any) => b.status === 'open').length;
  const inProgress = blockers.filter((b: any) => b.status === 'in_progress').length;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-error-500/10 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-error-500" />
        </div>
        <div>
          <h3 className="font-semibold text-text-heading">Blocker Summary</h3>
          <p className="text-sm text-text-muted">Actual blockers reported across the team</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-error-500/10 border border-error-500/20 text-center">
          <div className="text-3xl font-bold text-error-500">{critical}</div>
          <div className="text-xs text-text-muted">Critical</div>
        </div>
        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center">
          <div className="text-3xl font-bold text-orange-500">{high}</div>
          <div className="text-xs text-text-muted">High</div>
        </div>
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
          <div className="text-3xl font-bold text-red-500">{open}</div>
          <div className="text-xs text-text-muted">Open</div>
        </div>
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
          <div className="text-3xl font-bold text-yellow-500">{inProgress}</div>
          <div className="text-xs text-text-muted">In Progress</div>
        </div>
      </div>
    </Card>
  );
}

function MemberProgressCard({ member }: { member: MemberProgress }) {
  const progress = member.total > 0 ? Math.round((member.completed / member.total) * 100) : 0;
  const initials = member.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
            {member.avatar_url ? (
              <img src={member.avatar_url} alt={member.full_name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="font-semibold text-brand-primary text-sm">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-text-heading truncate">{member.full_name}</h3>
            <p className="text-xs text-text-muted truncate">{member.email}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Badge className="bg-blue-500/20 text-blue-400">{member.role}</Badge>
              <Badge className="bg-purple-500/20 text-purple-400">{member.department}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded-xl bg-canvas-surface border border-canvas-border">
            <div className="text-xl font-bold text-text-heading">{member.total}</div>
            <div className="text-[11px] text-text-muted">Total</div>
          </div>
          <div className="p-2 rounded-xl bg-canvas-surface border border-canvas-border">
            <div className="text-xl font-bold text-success-500">{member.completed}</div>
            <div className="text-[11px] text-text-muted">Done</div>
          </div>
          <div className="p-2 rounded-xl bg-canvas-surface border border-canvas-border">
            <div className="text-xl font-bold text-info-500">{member.inProgress}</div>
            <div className="text-[11px] text-text-muted">Active</div>
          </div>
          <div className="p-2 rounded-xl bg-canvas-surface border border-canvas-border">
            <div className="text-xl font-bold text-error-500">{member.blocked}</div>
            <div className="text-[11px] text-text-muted">Blocked</div>
          </div>
        </div>

        <div className="h-2 bg-canvas-surface rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-accent transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>{progress}% complete</span>
          <span>{member.velocity} pts/sprint</span>
        </div>
      </div>
    </Card>
  );
}

export function MonitorPage() {
  const [sprintId] = useState<string | undefined>(undefined);

  const membersQuery = useQuery({
    queryKey: ['team-members'],
    queryFn: () => teamMembersApi.list(),
    retry: false,
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks', 'monitor'],
    queryFn: () => tasksApi.list({ limit: 200 } as any),
    retry: false,
  });

  const blockersQuery = useQuery({
    queryKey: ['blockers', 'all'],
    queryFn: () => requirementsApi.listBlockers(),
    retry: false,
  });

  const workloadQuery = useQuery({
    queryKey: ['team', 'workload'],
    queryFn: () => analyticsApi.getTeamWorkload(),
    retry: false,
  });

  const deadlinesQuery = useQuery({
    queryKey: ['deadlines', 'upcoming'],
    queryFn: () => analyticsApi.getUpcomingDeadlines(10),
    retry: false,
  });

  const sprintQuery = useQuery({
    queryKey: ['sprint', 'progress', sprintId],
    queryFn: () => analyticsApi.getSprintProgress(sprintId),
    retry: false,
  });

  const sprintsQuery = useQuery({
    queryKey: ['sprints', 'monitor-list'],
    queryFn: () => requirementsApi.listSprints({ limit: 20 } as any),
    retry: false,
  });
  const sprintsList: any[] = useMemo(() => {
    const d: any = sprintsQuery.data;
    if (Array.isArray(d)) return d;
    return Array.isArray(d?.items) ? d.items : [];
  }, [sprintsQuery.data]);
  const reportSprintId = useMemo(() => {
    const active = sprintsList.find((s: any) => String(s.status) === 'active');
    return String((active ?? sprintsList[0] ?? {})?.id ?? '');
  }, [sprintsList]);

  const notesQuery = useQuery({
    queryKey: ['sprint-notes', 'monitor', reportSprintId],
    queryFn: () => requirementsApi.listSprintNotes(reportSprintId, 0, 20),
    retry: false,
    enabled: Boolean(reportSprintId),
  });

  const coreLoading = membersQuery.isLoading || tasksQuery.isLoading || blockersQuery.isLoading;
  const failedCount = [membersQuery, tasksQuery, blockersQuery, workloadQuery, deadlinesQuery].filter((q) => q.isError).length;

  const refetchAll = () => {
    membersQuery.refetch();
    tasksQuery.refetch();
    blockersQuery.refetch();
    workloadQuery.refetch();
    deadlinesQuery.refetch();
    sprintQuery.refetch();
    notesQuery.refetch();
  };

  const members: any[] = useMemo(() => {
    const d: unknown = membersQuery.data;
    return Array.isArray(d) ? d : [];
  }, [membersQuery.data]);

  const tasks: any[] = useMemo(() => {
    const d: any = tasksQuery.data;
    if (Array.isArray(d)) return d;
    return Array.isArray(d?.items) ? d.items : [];
  }, [tasksQuery.data]);

  const blockers: any[] = useMemo(() => {
    const d: unknown = blockersQuery.data;
    return Array.isArray(d) ? d : [];
  }, [blockersQuery.data]);

  const workload = useMemo(() => workloadQuery.data ?? [], [workloadQuery.data]);
  const deadlines = useMemo(() => deadlinesQuery.data ?? [], [deadlinesQuery.data]);
  const notes: any[] = useMemo(() => {
    const d: unknown = notesQuery.data;
    return Array.isArray(d) ? d : [];
  }, [notesQuery.data]);

  const progress: MemberProgress[] = useMemo(() => {
    return members.map((m: any) => {
      const email = String(m.email ?? '').toLowerCase();
      const mine = tasks.filter((t: any) => {
        const aid = String(t.assignee_id ?? t.assignee_email ?? '').toLowerCase();
        return aid !== '' && (aid === email || aid === String(m.id ?? '').toLowerCase());
      });
      const completed = mine.filter((t: any) => ['completed', 'done', 'success'].includes(String(t.status ?? '').toLowerCase())).length;
      const inProgress = mine.filter((t: any) => ['in_progress', 'in-progress', 'running', 'active'].includes(String(t.status ?? '').toLowerCase())).length;
      const blocked = mine.filter((t: any) => ['blocked', 'failed', 'error'].includes(String(t.status ?? '').toLowerCase())).length;
      return {
        id: String(m.id ?? email),
        full_name: String(m.full_name ?? m.email ?? 'Member'),
        email: String(m.email ?? ''),
        avatar_url: m.avatar_url,
        role: String(m.role ?? 'member'),
        department: String(m.department ?? 'General'),
        total: mine.length,
        completed,
        inProgress,
        blocked,
        velocity: completed * 3,
      };
    });
  }, [members, tasks]);

  if (coreLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton variant="title" className="w-72" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton variant="card" className="h-48" />
          <Skeleton variant="card" className="h-48" />
        </div>
        <Skeleton variant="card" className="h-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const sprint = sprintQuery.data as any | undefined;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-heading">Monitor</h1>
          <p className="text-text-body mt-1">How far each team member has come, actual blockers, and member reports.</p>
        </div>
        <Button variant="outline" onClick={() => refetchAll()} icon={<RefreshCw size={18} />}>
          Refresh
        </Button>
      </div>

      {failedCount > 0 && (
        <div className="rounded-2xl border border-warning-500/30 bg-warning-500/10 p-4 flex flex-wrap items-center gap-3">
          <p className="text-sm text-text-body flex-1 min-w-[200px]">
            Some monitor sections failed to load ({failedCount}). Showing available data.
          </p>
          <Button size="sm" variant="outline" onClick={() => refetchAll()}>Retry</Button>
        </div>
      )}

      <BlockerSummaryCard blockers={blockers} />

      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-heading">Team Member Progress</h2>
            <p className="text-xs text-text-muted">
              {progress.length} team members · {tasks.length} total tasks
            </p>
          </div>
        </div>

        {progress.length === 0 ? (
          <EmptyState
            title="No team members"
            description="Invite team members to start tracking progress."
            icon={<Users className="h-12 w-12" />}
            action={<Button onClick={() => window.location.href = '/team-members'} icon={<Plus size={18} />}>Invite Team Members</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {progress.map((member) => (
              <MemberProgressCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-error-500/10 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-error-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-heading">Actual Blockers</h2>
            <p className="text-xs text-text-muted">Impediments reported by the team</p>
          </div>
        </div>
        {blockers.length === 0 ? (
          <Card className="p-6 text-center text-sm text-text-muted">No blockers reported. The team is unblocked.</Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blockers.slice(0, 9).map((b: any) => (
              <Card key={String(b.id)} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-text-heading">{String(b.title ?? 'Blocker')}</h4>
                  <Badge className={PRIORITY_COLORS[String(b.priority ?? 'medium')] ?? PRIORITY_COLORS.medium}>
                    {String(b.priority ?? 'medium')}
                  </Badge>
                </div>
                {b.description && <p className="text-xs text-text-muted line-clamp-2">{String(b.description)}</p>}
                <div className="flex items-center justify-between">
                  <Badge className={STATUS_COLORS[String(b.status ?? 'open')] ?? STATUS_COLORS.open}>
                    {String(b.status ?? 'open')}
                  </Badge>
                  <span className="text-[11px] text-text-muted">
                    {b.created_at ? format(new Date(String(b.created_at)), 'MMM d, yyyy') : ''}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <div className={cn('w-8 h-8 rounded-xl bg-info-500/10 flex items-center justify-center')}>
            <TrendingUp className="h-4 w-4 text-info-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-heading">Team Workload</h2>
            <p className="text-xs text-text-muted">Capacity and balance across the team</p>
          </div>
        </div>
        <TeamWorkloadHeatmap workload={workload} />
      </section>

      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4 text-violet-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-heading">Member Reports</h2>
            <p className="text-xs text-text-muted">Latest standup and sprint notes from team members</p>
          </div>
        </div>
        {notes.length === 0 ? (
          <Card className="p-6 text-center text-sm text-text-muted">No member reports yet. Reports appear here once notes are added.</Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.slice(0, 6).map((n: any) => (
              <Card key={String(n.id)} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-heading">
                    {n.date ? format(new Date(String(n.date)), 'EEEE, MMM d') : 'Report'}
                  </span>
                  <Badge className="bg-violet-500/20 text-violet-400">{String(n.author_type ?? 'member')}</Badge>
                </div>
                <p className="text-sm text-text-body whitespace-pre-wrap line-clamp-4">
                  {String(n.notes ?? n.completed_work ?? n.in_progress ?? 'No content')}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-warning-500/10 flex items-center justify-center">
            <Clock className="h-4 w-4 text-warning-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-heading">Upcoming Deadlines</h2>
            <p className="text-xs text-text-muted">Sprint end, feature, QA, and review deadlines</p>
          </div>
        </div>
        <UpcomingDeadlines deadlines={deadlines} />
      </section>

      {sprint && (
        <section>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center">
              <Target className="h-4 w-4 text-brand-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-heading">Active Sprint Health</h2>
              <p className="text-xs text-text-muted">AI-calculated health indicator</p>
            </div>
          </div>
          <SprintHealthIndicator
            health={sprint.status === 'delayed' ? 'delayed' : 'healthy'}
            metrics={{
              completion: Number(sprint.completion ?? 0),
              daysRemaining: Number(sprint.days_remaining ?? 0),
              openBlockers: blockers.filter((b: any) => String(b.status) === 'open').length,
              velocity: Number(sprint.velocity ?? 0),
              plannedVelocity: Number(sprint.velocity ?? 0),
            }}
          />
        </section>
      )}
    </div>
  );
}
