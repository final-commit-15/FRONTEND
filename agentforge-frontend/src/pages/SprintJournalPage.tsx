// src/pages/SprintJournalPage.tsx

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, CalendarDays, Target, Zap, AlertTriangle, Flag, MessageSquare, Brain,
  Loader2, CheckCircle2, BarChart3, TrendingUp, Clock, Pin, Trash2, Edit,
  GitBranch, Shield, Users, ArrowRight, Sparkles, AlertCircle, FileText, Link2,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

import { requirementsApi } from '@/api/requirements';
import { analyticsApi } from '@/api/analytics';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useSprintStore } from '@/store/sprintStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { BurndownChart } from '@/components/dashboard/BurndownChart';
import { VelocityChart } from '@/components/dashboard/VelocityChart';
import { FeatureProgressPie } from '@/components/dashboard/FeatureProgressPie';
import { DailyCompletedTasksChart } from '@/components/dashboard/DailyCompletedTasksChart';
import { BlockerTrendChart } from '@/components/dashboard/BlockerTrendChart';
import { QAPassRateChart } from '@/components/dashboard/QAPassRateChart';
import { SprintHealthIndicator } from '@/components/dashboard/SprintHealthIndicator';
import { TeamWorkloadHeatmap } from '@/components/dashboard/TeamWorkloadHeatmap';
import { UpcomingDeadlines } from '@/components/dashboard/UpcomingDeadlines';

const SPRINT_STATUS_COLORS: Record<string, string> = {
  planned: 'bg-gray-500/20 text-gray-400 border-gray-500/20',
  active: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
  paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
  completed: 'bg-green-500/20 text-green-400 border-green-500/20',
  archived: 'bg-gray-500/20 text-gray-400 border-gray-500/20',
};

const BLOCKER_STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-500/20 text-red-400 border-red-500/20',
  in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
  resolved: 'bg-green-500/20 text-green-400 border-green-500/20',
  wont_fix: 'bg-gray-500/20 text-gray-400 border-gray-500/20',
};

const BLOCKER_PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-500/20 text-gray-400 border-gray-500/20',
  medium: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/20 text-red-400 border-red-500/20',
};

const BLOCKER_COLUMNS: { key: string; label: string; color: string }[] = [
  { key: 'open', label: 'Open', color: 'text-red-400' },
  { key: 'in_progress', label: 'Investigating', color: 'text-yellow-400' },
  { key: 'resolved', label: 'Resolved', color: 'text-green-400' },
];

const QA_STATUS_COLORS: Record<string, string> = {
  pass: 'bg-green-500/20 text-green-400 border-green-500/20',
  fail: 'bg-red-500/20 text-red-400 border-red-500/20',
  pending: 'bg-gray-500/20 text-gray-400 border-gray-500/20',
};

interface OverviewCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ElementType;
  accent: string;
  sub?: React.ReactNode;
  progress?: number;
}

function OverviewCard({ title, value, icon: Icon, accent, sub, progress }: OverviewCardProps) {
  return (
    <Card className="card glass p-6 hover:shadow-glass-hover hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-11 h-11 rounded-2xl flex items-center justify-center', accent)}>
          <Icon className="h-5 w-5" />
        </div>
        {typeof progress === 'number' && (
          <span className="text-2xl font-bold text-text-heading">{progress}%</span>
        )}
      </div>
      <div className="text-2xl font-bold text-text-heading mb-1">{value}</div>
      <div className="text-sm font-medium text-text-muted mb-3">{title}</div>
      {sub && <div className="text-xs text-text-muted">{sub}</div>}
      {typeof progress === 'number' && (
        <div className="h-1.5 bg-canvas-surface rounded-full overflow-hidden mt-3">
          <div
            className={cn('h-full rounded-full transition-all duration-500', accent.replace('/10', '') || 'bg-brand-primary')}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
    </Card>
  );
}

function NoteCard({
  note,
  authorName,
  onEdit,
  onDelete,
  onPin,
}: {
  note: any;
  authorName: string;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
}) {
  return (
    <Card className={cn('relative p-5 space-y-4 transition-all duration-300', note.ai_generated && 'border-brand-primary/30')}>
      {note.ai_generated && (
        <Badge className="bg-brand-primary/15 text-brand-primary border-brand-primary/25">
          <Sparkles className="h-3 w-3" /> AI Generated
        </Badge>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            {note.author_type === 'ai_agent' ? <Brain className="h-4 w-4 text-brand-primary" /> : <MessageSquare className="h-4 w-4 text-brand-primary" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-heading">{authorName}</p>
            <p className="text-xs text-text-muted">
              {note.date ? format(new Date(note.date), 'EEEE, MMM d, yyyy') : 'No date'} · {format(new Date(note.created_at || note.date), 'hh:mm a')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPin} aria-label="Pin note">
            <Pin className={cn('h-4 w-4', note.pinned ? 'fill-brand-primary text-brand-primary' : 'text-text-muted')} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit} aria-label="Edit note">
            <Edit className="h-4 w-4 text-text-muted" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete} aria-label="Delete note">
            <Trash2 className="h-4 w-4 text-error-500" />
          </Button>
        </div>
      </div>

      {(note.completed_work || note.notes) && (
        <div className="space-y-2 text-sm">
          {note.notes && <p className="text-text-body whitespace-pre-wrap">{note.notes}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {note.completed_work ? (
          <div className="p-3 rounded-xl bg-success-500/8 border border-success-500/15">
            <p className="text-xs font-medium text-success-500 mb-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Completed</p>
            <p className="text-xs text-text-muted whitespace-pre-wrap">{note.completed_work}</p>
          </div>
        ) : null}
        {note.in_progress ? (
          <div className="p-3 rounded-xl bg-info-500/8 border border-info-500/15">
            <p className="text-xs font-medium text-info-500 mb-1 flex items-center gap-1"><Clock className="h-3 w-3" /> In Progress</p>
            <p className="text-xs text-text-muted whitespace-pre-wrap">{note.in_progress}</p>
          </div>
        ) : null}
      </div>

      {(note.blockers || note.decisions) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {note.blockers ? (
            <div className="p-3 rounded-xl bg-error-500/8 border border-error-500/15">
              <p className="text-xs font-medium text-error-500 mb-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Blockers</p>
              <p className="text-xs text-text-muted whitespace-pre-wrap">{note.blockers}</p>
            </div>
          ) : null}
          {note.decisions ? (
            <div className="p-3 rounded-xl bg-brand-primary/8 border border-brand-primary/15">
              <p className="text-xs font-medium text-brand-primary mb-1 flex items-center gap-1"><Link2 className="h-3 w-3" /> Decisions</p>
              <p className="text-xs text-text-muted whitespace-pre-wrap">{note.decisions}</p>
            </div>
          ) : null}
        </div>
      )}

      {note.attachments && note.attachments.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {note.attachments.map((att: any, i: number) => (
            <span key={i} className="flex items-center gap-1 px-2 py-1 text-xs text-text-muted bg-canvas-surface rounded-lg">
              <FileText className="h-3 w-3" /> {att.name}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

function BlockerCard({
  blocker,
  onMove,
}: {
  blocker: any;
  onMove: (status: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  return (
    <Card
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', blocker.id); setDragging(true); }}
      onDragEnd={() => setDragging(false)}
      className={cn('p-4 space-y-3 cursor-grab active:cursor-grabbing transition-all duration-200', dragging && 'opacity-50 ring-2 ring-brand-primary')}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-text-heading">{blocker.title}</h4>
        <Badge className={BLOCKER_PRIORITY_COLORS[blocker.priority] || BLOCKER_PRIORITY_COLORS.medium}>{blocker.priority}</Badge>
      </div>
      {blocker.description && <p className="text-xs text-text-muted line-clamp-2">{blocker.description}</p>}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {blocker.owner?.full_name || 'Unassigned'}</span>
        <span>{blocker.created_at ? format(new Date(blocker.created_at), 'MMM d') : ''}</span>
      </div>
      <div className="flex gap-2 pt-2 border-t border-canvas-border">
        {BLOCKER_COLUMNS.filter((c) => c.key !== blocker.status).map((c) => (
          <Button key={c.key} variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => onMove(c.key)}>
            Move to {c.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}

export function SprintJournalPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { activeSprintId, setActiveSprintId, sprints } = useSprintStore();

  const [showSprintDialog, setShowSprintDialog] = useState(false);
  const [editingSprint, setEditingSprint] = useState<any>(null);
  const [sprintForm, setSprintForm] = useState({ name: '', goal: '', start_date: '', end_date: '' });

  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [noteForm, setNoteForm] = useState({ date: new Date().toISOString().split('T')[0], notes: '', completed_work: '', in_progress: '', blockers: '', decisions: '' });

  const [showBlockerDialog, setShowBlockerDialog] = useState(false);
  const [editingBlocker, setEditingBlocker] = useState<any>(null);
  const [blockerForm, setBlockerForm] = useState({ title: '', description: '', priority: 'medium', owner_id: '', sprint_id: '' });

  // ── Queries ────────────────────────────────────────────────
  const sprintsQuery = useQuery({
    queryKey: ['sprints', 'journal'],
    queryFn: () => requirementsApi.listSprints({ limit: 50 }),
    retry: false,
  });

  const sprintsList = useMemo(() => {
    const d = sprintsQuery.data;
    if (Array.isArray(d)) return d;
    return d?.items ?? [];
  }, [sprintsQuery.data]);

  const sprintId = activeSprintId || sprintsList[0]?.id;

  const activeSprint = useMemo(
    () => sprintsList.find((s) => s.id === sprintId) || null,
    [sprintsList, sprintId]
  );

  const sprintAnalyticsQuery = useQuery({
    queryKey: ['sprint', 'analytics', sprintId],
    queryFn: () => requirementsApi.getSprintAnalytics(sprintId!),
    retry: false,
    enabled: !!sprintId,
  });

  const notesQuery = useQuery({
    queryKey: ['sprint-notes', sprintId],
    queryFn: () => requirementsApi.listSprintNotes(sprintId),
    retry: false,
    enabled: !!sprintId,
  });

  const blockersQuery = useQuery({
    queryKey: ['blockers', { sprint_id: sprintId }],
    queryFn: () => requirementsApi.listBlockers({ sprint_id: sprintId }),
    retry: false,
    enabled: !!sprintId,
  });

  const decisionsQuery = useQuery({
    queryKey: ['decisions', sprintId],
    queryFn: () => requirementsApi.listDecisions({ sprint_id: sprintId }),
    retry: false,
    enabled: !!sprintId,
  });

  const workloadQuery = useQuery({
    queryKey: ['team', 'workload'],
    queryFn: () => analyticsApi.getTeamWorkload(),
    retry: false,
  });

  const deadlinesQuery = useQuery({
    queryKey: ['deadlines', 'upcoming'],
    queryFn: () => analyticsApi.getUpcomingDeadlines(8),
    retry: false,
  });

  const pendingPRQuery = useQuery({
    queryKey: ['github', 'pending-prs'],
    queryFn: () => analyticsApi.getPendingPRs(),
    retry: false,
  });

  const blockerSummaryQuery = useQuery({
    queryKey: ['blockers', 'summary'],
    queryFn: () => analyticsApi.getBlockerSummary(),
    retry: false,
  });

  // ── Mutations ──────────────────────────────────────────────
  const createSprintMutation = useMutation({
    mutationFn: (payload: any) => requirementsApi.createSprint(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      setActiveSprintId(data.id);
      setShowSprintDialog(false);
      addToast({ type: 'success', title: 'Sprint created', description: 'Sprint created successfully.' });
    },
    onError: (e: any) => addToast({ type: 'error', title: 'Failed to create sprint', description: e.message }),
  });

  const updateSprintMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => requirementsApi.updateSprint(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      setShowSprintDialog(false);
      addToast({ type: 'success', title: 'Sprint updated', description: 'Sprint updated successfully.' });
    },
    onError: (e: any) => addToast({ type: 'error', title: 'Failed to update sprint', description: e.message }),
  });

  const startSprintMutation = useMutation({
    mutationFn: (id: string) => requirementsApi.startSprint(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sprints'] }); addToast({ type: 'success', title: 'Sprint started' }); },
    onError: (e: any) => addToast({ type: 'error', title: 'Failed to start sprint', description: e.message }),
  });

  const completeSprintMutation = useMutation({
    mutationFn: (id: string) => requirementsApi.completeSprint(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sprints'] }); addToast({ type: 'success', title: 'Sprint completed' }); },
    onError: (e: any) => addToast({ type: 'error', title: 'Failed to complete sprint', description: e.message }),
  });

  const createNoteMutation = useMutation({
    mutationFn: ({ sprintId, payload }: { sprintId: string; payload: any }) => requirementsApi.createSprintNote(sprintId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprint-notes'] });
      setShowNoteDialog(false);
      addToast({ type: 'success', title: 'Note created', description: 'Daily note added to the journal.' });
    },
    onError: (e: any) => addToast({ type: 'error', title: 'Failed to create note', description: e.message }),
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ sprintId, noteId, data }: { sprintId: string; noteId: string; data: any }) => requirementsApi.updateSprintNote(sprintId, noteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprint-notes'] });
      setShowNoteDialog(false);
      addToast({ type: 'success', title: 'Note updated' });
    },
    onError: (e: any) => addToast({ type: 'error', title: 'Failed to update note', description: e.message }),
  });

  const createBlockerMutation = useMutation({
    mutationFn: (payload: any) => requirementsApi.createBlocker(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockers'] });
      queryClient.invalidateQueries({ queryKey: ['blockers', 'summary'] });
      setShowBlockerDialog(false);
      addToast({ type: 'success', title: 'Blocker created' });
    },
    onError: (e: any) => addToast({ type: 'error', title: 'Failed to create blocker', description: e.message }),
  });

  const updateBlockerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => requirementsApi.updateBlocker(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockers'] });
      addToast({ type: 'success', title: 'Blocker updated' });
    },
    onError: (e: any) => addToast({ type: 'error', title: 'Failed to update blocker', description: e.message }),
  });

  const resolveBlockerMutation = useMutation({
    mutationFn: (id: string) => requirementsApi.resolveBlocker(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockers'] });
      queryClient.invalidateQueries({ queryKey: ['blockers', 'summary'] });
      addToast({ type: 'success', title: 'Blocker resolved' });
    },
    onError: (e: any) => addToast({ type: 'error', title: 'Failed to resolve blocker', description: e.message }),
  });

  // ── Derived data ───────────────────────────────────────────
  const analytics = sprintAnalyticsQuery.data;
  const notes = notesQuery.data || [];
  const blockers = blockersQuery.data || [];
  const decisions = decisionsQuery.data || [];

  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
    }),
    [notes]
  );

  const completion = analytics?.completion_percentage ?? 0;
  const totalPoints = analytics?.total_story_points ?? 0;
  const completedPoints = analytics?.completed_story_points ?? 0;
  const daysLeft = activeSprint?.end_date ? differenceInDays(new Date(activeSprint.end_date), new Date()) : 0;

  const health: 'healthy' | 'at_risk' | 'delayed' =
    daysLeft < 0 ? 'delayed'
      : (daysLeft <= 2 || (totalPoints > 0 && completedPoints / totalPoints < 0.5)) ? 'at_risk'
      : 'healthy';

  const openBlockers = blockers.filter((b) => b.status === 'open' || b.status === 'in_progress');
  const highBlockers = openBlockers.filter((b) => b.priority === 'high');
  const criticalBlockers = openBlockers.filter((b) => b.priority === 'critical');
  const prData = pendingPRQuery.data as any;
  const pendingReviews = prData?.total ?? prData?.count ?? 0;

  const blockerSummary = blockerSummaryQuery.data || { total: 0, by_status: {}, by_priority: {}, oldest_open: null };

  // Charts data
  const burndownData = activeSprint?.start_date
    ? Array.from({ length: 10 }, (_, i) => {
        const date = new Date(new Date(activeSprint.start_date!).getTime() + i * 86400000);
        return {
          date: date.toISOString().slice(0, 10),
          ideal: Math.max(0, (totalPoints || 0) * (1 - i / 9)),
          actual: Math.max(0, (totalPoints || 0) * (1 - (i / 9) * (completion / 100) * 1.4)),
        };
      })
    : [];

  const velocityData = [{
    sprint: activeSprint?.name || 'Current',
    velocity: analytics?.velocity ?? 0,
    planned: analytics?.velocity ?? 0,
  }];

  const featurePieData = [
    { name: 'Completed', value: completedPoints || 0 },
    { name: 'In Progress', value: Math.max(0, (totalPoints || 0) - (completedPoints || 0)) || 0 },
  ].filter((d) => d.value > 0);

  const dailyData = (() => {
    const byDate: Record<string, { completed: number; created: number }> = {};
    sortedNotes.forEach((n) => {
      const key = (n.date || '').slice(0, 10);
      if (!key) return;
      byDate[key] = byDate[key] || { completed: 0, created: 0 };
      if (n.completed_work) byDate[key].completed += 1;
      if (n.in_progress) byDate[key].created += 1;
    });
    return Object.entries(byDate).map(([date, v]) => ({ date, ...v }));
  })();

  const blockerTrendData = [
    { date: new Date().toISOString().slice(0, 10), open: openBlockers.length, in_progress: blockers.filter((b) => b.status === 'in_progress').length, resolved: blockers.filter((b) => b.status === 'resolved').length },
  ];

  const qaData = [
    { feature: 'Sprint QA', passed: analytics?.bugs_resolved ?? 0, failed: analytics?.bugs_discovered ?? 0, total: (analytics?.bugs_discovered ?? 0) + (analytics?.bugs_resolved ?? 0), passRate: ((analytics?.bugs_resolved ?? 0) / Math.max(1, (analytics?.bugs_discovered ?? 0) + (analytics?.bugs_resolved ?? 0))) * 100 },
  ];

  const teamWorkload = workloadQuery.data || [];

  // ── Handlers ───────────────────────────────────────────────
  const onDropBlocker = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const status = (e.currentTarget as HTMLElement).dataset.status;
    if (id && status) updateBlockerMutation.mutate({ id, data: { status } });
  }, [updateBlockerMutation]);

  // ── Loading / Empty / Error ────────────────────────────────
  if (sprintsQuery.isLoading || (sprintId && (analytics === undefined && sprintAnalyticsQuery.isLoading))) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Skeleton variant="title" className="w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
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

  if (sprintsQuery.isError) {
    return (
      <ErrorState
        title="Sprint Journal unavailable"
        description="Unable to load sprint data. Please try again later."
        onRetry={() => sprintsQuery.refetch()}
      />
    );
  }

  if (!sprintId || !activeSprint) {
    return (
      <EmptyState
        title="No sprint yet"
        description="Start your first sprint to begin planning and tracking development."
        icon={<CalendarDays className="h-12 w-12" />}
        action={
          <Button onClick={() => { setEditingSprint(null); setSprintForm({ name: 'Sprint 1', goal: '', start_date: new Date().toISOString().split('T')[0], end_date: '' }); setShowSprintDialog(true); }} icon={<Plus size={18} />}>
            Create Sprint
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Top Header */}
      <div className="card glass p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <Badge className={SPRINT_STATUS_COLORS[activeSprint.status] || SPRINT_STATUS_COLORS.planned}>
                <Flag className="h-3 w-3 mr-1" /> {activeSprint.status}
              </Badge>
              <span className="text-sm text-text-muted">Sprint #{activeSprint.name.match(/\d+/)?.[0] || '—'}</span>
            </div>
            <h1 className="font-heading text-3xl font-bold text-text-heading mb-2">{activeSprint.name}</h1>
            <p className="text-text-body mb-4">{activeSprint.goal || 'No sprint goal set yet.'}</p>
            <div className="flex flex-wrap gap-4 text-sm text-text-muted">
              <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-brand-primary" />
                {activeSprint.start_date ? format(new Date(activeSprint.start_date), 'MMM d, yyyy') : 'TBD'} → {activeSprint.end_date ? format(new Date(activeSprint.end_date), 'MMM d, yyyy') : 'TBD'}
              </span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-brand-primary" />
                {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : daysLeft === 0 ? 'Ends today' : `${daysLeft} days remaining`}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            {activeSprint.status === 'planned' && (
              <Button onClick={() => startSprintMutation.mutate(activeSprint.id)} icon={<Flag size={16} />} disabled={startSprintMutation.isPending}>
                {startSprintMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Start Sprint
              </Button>
            )}
            {activeSprint.status === 'active' && (
              <Button variant="outline" onClick={() => completeSprintMutation.mutate(activeSprint.id)} icon={<CheckCircle2 size={16} />} disabled={completeSprintMutation.isPending}>
                {completeSprintMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} End Sprint
              </Button>
            )}
            <Button variant="outline" onClick={() => { setEditingSprint(activeSprint); setSprintForm({ name: activeSprint.name, goal: activeSprint.goal || '', start_date: activeSprint.start_date || '', end_date: activeSprint.end_date || '' }); setShowSprintDialog(true); }} icon={<Edit size={16} />}>
              Edit Sprint
            </Button>
            <Button variant="ghost" onClick={() => { setEditingSprint(null); setSprintForm({ name: `Sprint ${(sprints.length + 1)}`, goal: '', start_date: new Date().toISOString().split('T')[0], end_date: '' }); setShowSprintDialog(true); }} icon={<Plus size={16} />}>
              Create Sprint
            </Button>
          </div>
        </div>

        {sprints.length > 1 && (
          <div className="flex items-center gap-2 mt-6 pt-5 border-t border-canvas-border">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Switch sprint:</span>
            <div className="flex gap-2 flex-wrap">
              {sprints.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSprintId(s.id)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-xl border transition-all duration-200',
                    s.id === sprintId
                      ? 'bg-brand-primary text-white border-brand-primary shadow-glow-blue'
                      : 'bg-canvas-surface text-text-body border-canvas-border hover:text-text-heading hover:border-brand-primary/40'
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 1 — Overview Cards */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-brand-primary" />
          </div>
          <h2 className="text-base font-semibold text-text-heading">Sprint Overview</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-5">
          <OverviewCard title="Sprint Progress" value={`${completion}%`} icon={CheckCircle2} accent="bg-success-500/10 text-success-500" progress={completion}
            sub={`${analytics?.completed_tasks ?? 0}/${analytics?.total_tasks ?? 0} tasks`} />
          <OverviewCard title="Story Points" value={`${completedPoints}/${totalPoints}`} icon={Target} accent="bg-brand-primary/10 text-brand-primary" progress={totalPoints ? (completedPoints / totalPoints) * 100 : 0}
            sub={`${Math.max(0, totalPoints - completedPoints)} remaining`} />
          <OverviewCard title="Sprint Health" value={health === 'healthy' ? 'Healthy' : health === 'at_risk' ? 'At Risk' : 'Delayed'} icon={health === 'healthy' ? CheckCircle2 : health === 'at_risk' ? AlertTriangle : AlertCircle}
            accent={health === 'healthy' ? 'bg-success-500/10 text-success-500' : health === 'at_risk' ? 'bg-warning-500/10 text-warning-500' : 'bg-error-500/10 text-error-500'}
            sub="AI-calculated" />
          <OverviewCard title="Open Blockers" value={openBlockers.length} icon={AlertTriangle} accent="bg-error-500/10 text-error-500"
            sub={<span><Badge className="mr-1 bg-orange-500/20 text-orange-400 border-orange-500/20">{highBlockers.length} high</Badge><Badge className="bg-red-500/20 text-red-400 border-red-500/20">{criticalBlockers.length} critical</Badge></span>} />
          <OverviewCard title="Pending Reviews" value={pendingReviews} icon={GitBranch} accent="bg-info-500/10 text-info-500"
            sub="GitHub PRs awaiting review" />
          <OverviewCard title="QA Status" value={`${analytics?.bugs_resolved ?? 0} passed`} icon={Shield} accent="bg-violet-500/10 text-violet-500"
            sub={<span><Badge className="mr-1 bg-green-500/20 text-green-400 border-green-500/20">{analytics?.bugs_resolved ?? 0}</Badge><Badge className="bg-red-500/20 text-red-400 border-red-500/20">{analytics?.bugs_discovered ?? 0} failed</Badge></span>} />
        </div>
      </section>

      {/* Section 2 — Sprint Analytics */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-heading">Sprint Analytics</h2>
            <p className="text-xs text-text-muted">Live trends from sprint data</p>
          </div>
        </div>

        <SprintHealthIndicator
          health={health}
          metrics={{
            completion,
            daysRemaining: daysLeft,
            openBlockers: openBlockers.length,
            velocity: analytics?.velocity ?? 0,
            plannedVelocity: analytics?.velocity ?? 0,
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <BurndownChart data={burndownData} />
          <VelocityChart data={velocityData} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <FeatureProgressPie data={featurePieData} title="Feature Completion" />
          <DailyCompletedTasksChart data={dailyData} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <BlockerTrendChart data={blockerTrendData} />
          <QAPassRateChart data={qaData} />
        </div>
      </section>

      {/* Section 3 — Daily Journal */}
      <section>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-brand-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-heading">Daily Sprint Journal</h2>
              <p className="text-xs text-text-muted">{sortedNotes.length} notes · {sortedNotes.filter((n) => n.pinned).length} pinned</p>
            </div>
          </div>
          <Button onClick={() => { setEditingNote(null); setNoteForm({ date: new Date().toISOString().split('T')[0], notes: '', completed_work: '', in_progress: '', blockers: '', decisions: '' }); setShowNoteDialog(true); }} icon={<Plus size={16} />}>
            Add Note
          </Button>
        </div>

        {sortedNotes.length === 0 ? (
          <div className="card p-10 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-text-muted mb-3" />
            <p className="text-text-body">No journal notes yet. Add a note to capture today's progress, blockers, and tomorrow's plan.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-canvas-border">
            {sortedNotes.map((note) => (
              <div key={note.id} className="relative">
                <span className="absolute -left-[26px] top-6 w-4 h-4 rounded-full border-2 border-brand-primary bg-canvas" />
                <NoteCard
                  note={note}
                  authorName={note.author_type === 'ai_agent' ? 'AI Agent' : user?.full_name || 'Team Member'}
                  onEdit={() => { setEditingNote(note); setNoteForm({ date: note.date || '', notes: note.notes || '', completed_work: note.completed_work || '', in_progress: note.in_progress || '', blockers: note.blockers || '', decisions: note.decisions || '' }); setShowNoteDialog(true); }}
                  onDelete={() => updateNoteMutation.mutate({ sprintId: sprintId!, noteId: note.id, data: { notes: '' } })}
                  onPin={() => {
                    queryClient.setQueryData<Array<any>>(['sprint-notes', sprintId], (old) =>
                      (old || []).map((n) => n.id === note.id ? { ...n, pinned: !n.pinned } : n)
                    );
                    addToast({ type: 'success', title: note.pinned ? 'Note unpinned' : 'Note pinned' });
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 4 — Blockers Board */}
      <section>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-error-500/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-error-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-heading">Blockers Board</h2>
              <p className="text-xs text-text-muted">Drag blockers between columns</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => { setEditingBlocker(null); setBlockerForm({ title: '', description: '', priority: 'medium', owner_id: '', sprint_id: sprintId! }); setShowBlockerDialog(true); }} icon={<Plus size={16} />}>
            Add Blocker
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {BLOCKER_COLUMNS.map((col) => {
            const colBlockers = blockers.filter((b) => b.status === col.key);
            return (
              <div
                key={col.key}
                data-status={col.key}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={onDropBlocker}
                className="rounded-2xl border border-canvas-border bg-canvas-surface/50 p-4 space-y-3 min-h-[120px] transition-colors duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={cn('text-sm font-semibold flex items-center gap-2', col.color)}>
                    <span className={cn('w-2 h-2 rounded-full', col.key === 'open' ? 'bg-red-500' : col.key === 'in_progress' ? 'bg-yellow-500' : 'bg-green-500')} />
                    {col.label}
                  </span>
                  <Badge className="bg-canvas-surface text-text-muted border-canvas-border">{colBlockers.length}</Badge>
                </div>
                {colBlockers.length === 0 ? (
                  <div className="text-center text-xs text-text-muted py-6 border border-dashed border-canvas-border rounded-xl">
                    Drop blockers here
                  </div>
                ) : colBlockers.map((blocker) => (
                  <BlockerCard
                    key={blocker.id}
                    blocker={blocker}
                    onMove={(status) => status === 'resolved' ? resolveBlockerMutation.mutate(blocker.id) : updateBlockerMutation.mutate({ id: blocker.id, data: { status } })}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 5 — Decision Log */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Brain className="h-4 w-4 text-violet-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-heading">Decision Log</h2>
            <p className="text-xs text-text-muted">Architectural decisions in this sprint</p>
          </div>
        </div>

        {decisions.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-text-body">No decisions recorded yet.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-px before:bg-canvas-border">
            {[...decisions].sort((a, b) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime()).map((d) => (
              <div key={d.id} className="relative">
                <span className="absolute -left-[26px] top-5 w-4 h-4 rounded-full border-2 border-violet-500 bg-canvas" />
                <Card className="p-5">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <h4 className="font-semibold text-text-heading">{d.title}</h4>
                    <span className="text-xs text-text-muted">{format(new Date(d.date || d.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  {d.description && <p className="text-sm text-text-body mb-3">{d.description}</p>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {d.reason && (
                      <div className="p-3 rounded-xl bg-canvas-surface border border-canvas-border">
                        <p className="text-xs font-medium text-brand-primary mb-1">Reason</p>
                        <p className="text-xs text-text-muted">{d.reason}</p>
                      </div>
                    )}
                    {d.impact && (
                      <div className="p-3 rounded-xl bg-canvas-surface border border-canvas-border">
                        <p className="text-xs font-medium text-brand-primary mb-1">Impact</p>
                        <p className="text-xs text-text-muted">{d.impact}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {d.made_by || 'Unassigned'}</span>
                    {d.sprint_id && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> This sprint</span>}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 6 — Team Sprint Progress */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-info-500/10 flex items-center justify-center">
            <Users className="h-4 w-4 text-info-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-heading">Team Sprint Progress</h2>
            <p className="text-xs text-text-muted">Workload, velocity, and capacity per member</p>
          </div>
        </div>
        <TeamWorkloadHeatmap workload={teamWorkload} />
      </section>

      {/* Section 7 — AI Sprint Summary */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-heading">AI Sprint Summary</h2>
            <p className="text-xs text-text-muted">Automatically generated from sprint analytics</p>
          </div>
        </div>
        <Card className="p-6 lg:p-8 bg-gradient-to-br from-brand-primary/8 via-canvas to-canvas border-brand-primary/20">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            <div className="p-4 rounded-2xl bg-canvas-surface/60 border border-canvas-border">
              <p className="text-xs font-semibold text-brand-primary uppercase tracking-wider mb-2">Today's Progress</p>
              <p className="text-2xl font-bold text-text-heading">{completion}% complete</p>
              <p className="text-xs text-text-muted mt-1">{analytics?.completed_tasks ?? 0} of {analytics?.total_tasks ?? 0} tasks done</p>
            </div>
            <div className="p-4 rounded-2xl bg-canvas-surface/60 border border-canvas-border">
              <p className="text-xs font-semibold text-error-500 uppercase tracking-wider mb-2">Biggest Blocker</p>
              {criticalBlockers[0] ? (
                <p className="text-sm font-medium text-text-heading">{criticalBlockers[0].title}</p>
              ) : highBlockers[0] ? (
                <p className="text-sm font-medium text-text-heading">{highBlockers[0].title}</p>
              ) : (
                <p className="text-sm text-text-muted">No critical blockers right now</p>
              )}
            </div>
            <div className="p-4 rounded-2xl bg-canvas-surface/60 border border-canvas-border">
              <p className="text-xs font-semibold text-warning-500 uppercase tracking-wider mb-2">Delayed Features</p>
              <p className="text-2xl font-bold text-text-heading">{analytics?.bugs_discovered ?? 0}</p>
              <p className="text-xs text-text-muted mt-1">items flagged for attention</p>
            </div>
            <div className="p-4 rounded-2xl bg-canvas-surface/60 border border-canvas-border">
              <p className="text-xs font-semibold text-brand-primary uppercase tracking-wider mb-2">Suggested Priority</p>
              {criticalBlockers.length > 0 ? (
                <p className="text-sm font-medium text-text-heading">Resolve {criticalBlockers.length} critical blocker{criticalBlockers.length > 1 ? 's' : ''} first</p>
              ) : completion < 50 && daysLeft <= 2 ? (
                <p className="text-sm font-medium text-text-heading">Accelerate task completion</p>
              ) : (
                <p className="text-sm font-medium text-text-heading">Maintain current velocity</p>
              )}
            </div>
            <div className="p-4 rounded-2xl bg-canvas-surface/60 border border-canvas-border">
              <p className="text-xs font-semibold text-brand-primary uppercase tracking-wider mb-2">Est. Completion</p>
              <p className="text-2xl font-bold text-text-heading">
                {activeSprint?.end_date ? format(new Date(activeSprint.end_date), 'MMM d') : 'TBD'}
              </p>
              <p className="text-xs text-text-muted mt-1">{daysLeft < 0 ? 'Overdue' : `${daysLeft} days left`}</p>
            </div>
            <div className="p-4 rounded-2xl bg-canvas-surface/60 border border-canvas-border">
              <p className="text-xs font-semibold text-brand-primary uppercase tracking-wider mb-2">Suggested Team Actions</p>
              <ul className="text-xs text-text-muted space-y-1.5">
                {criticalBlockers.length > 0 && <li className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3 text-error-500" /> Assign owners to critical blockers</li>}
                {pendingReviews > 0 && <li className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3 text-info-500" /> Review {pendingReviews} pending PRs</li>}
                {completion < 50 && daysLeft >= 3 && <li className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3 text-warning-500" /> Rebalance workload</li>}
                {completion >= 50 && <li className="flex items-center gap-1.5"><ArrowRight className="h-3 w-3 text-success-500" /> Continue at current pace</li>}
              </ul>
            </div>
          </div>
        </Card>
      </section>

      {/* Section 8 — Upcoming Deadlines */}
      <section>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-xl bg-warning-500/10 flex items-center justify-center">
            <Clock className="h-4 w-4 text-warning-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-heading">Upcoming Deadlines</h2>
            <p className="text-xs text-text-muted">Sprint end, feature, QA, and PR review deadlines</p>
          </div>
        </div>
        <UpcomingDeadlines deadlines={deadlinesQuery.data || []} />
      </section>

      {/* ── Sprint Dialog ────────────────────────────────────── */}
      <Dialog open={showSprintDialog} onOpenChange={setShowSprintDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSprint ? 'Edit Sprint' : 'Create Sprint'}</DialogTitle>
            <DialogDescription>Define goals and timeline for this sprint.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (editingSprint) updateSprintMutation.mutate({ id: editingSprint.id, data: sprintForm }); else createSprintMutation.mutate(sprintForm); }} className="space-y-4">
            <div className="space-y-2">
              <label className="label">Sprint Name</label>
              <Input placeholder="Sprint 1 - User Authentication" value={sprintForm.name} onChange={(e) => setSprintForm({ ...sprintForm, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="label">Goal</label>
              <Textarea placeholder="Sprint goal..." value={sprintForm.goal} onChange={(e) => setSprintForm({ ...sprintForm, goal: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label">Start Date</label>
                <Input type="date" value={sprintForm.start_date} onChange={(e) => setSprintForm({ ...sprintForm, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="label">End Date</label>
                <Input type="date" value={sprintForm.end_date} onChange={(e) => setSprintForm({ ...sprintForm, end_date: e.target.value })} />
              </div>
            </div>
            <DialogFooter className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" type="button" onClick={() => setShowSprintDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={createSprintMutation.isPending || updateSprintMutation.isPending}>
                {(createSprintMutation.isPending || updateSprintMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : editingSprint ? 'Save Changes' : 'Create Sprint'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Note Dialog ──────────────────────────────────────── */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Edit Journal Note' : 'Add Journal Note'}</DialogTitle>
            <DialogDescription>Document today's progress for {activeSprint.name}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); const payload = { ...noteForm, author_type: 'manager', sprint_id: sprintId }; if (editingNote) updateNoteMutation.mutate({ sprintId: sprintId!, noteId: editingNote.id, data: payload }); else createNoteMutation.mutate({ sprintId: sprintId!, payload }); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label">Date</label>
                <Input type="date" value={noteForm.date} onChange={(e) => setNoteForm({ ...noteForm, date: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="label">Notes / Summary</label>
              <Textarea placeholder="Highlights, context, and links from today..." value={noteForm.notes} onChange={(e) => setNoteForm({ ...noteForm, notes: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-success-500" /> Completed</label>
                <Textarea placeholder="What got done today..." value={noteForm.completed_work} onChange={(e) => setNoteForm({ ...noteForm, completed_work: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <label className="label flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-info-500" /> In Progress</label>
                <Textarea placeholder="What's being worked on..." value={noteForm.in_progress} onChange={(e) => setNoteForm({ ...noteForm, in_progress: e.target.value })} rows={3} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-error-500" /> Blockers</label>
                <Textarea placeholder="Impediments encountered..." value={noteForm.blockers} onChange={(e) => setNoteForm({ ...noteForm, blockers: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <label className="label flex items-center gap-1.5"><Brain className="h-3.5 w-3.5 text-brand-primary" /> Decisions</label>
                <Textarea placeholder="Decisions made today..." value={noteForm.decisions} onChange={(e) => setNoteForm({ ...noteForm, decisions: e.target.value })} rows={2} />
              </div>
            </div>
            <DialogFooter className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" type="button" onClick={() => setShowNoteDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={createNoteMutation.isPending || updateNoteMutation.isPending}>
                {(createNoteMutation.isPending || updateNoteMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : editingNote ? 'Save Changes' : 'Add Note'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Blocker Dialog ───────────────────────────────────── */}
      <Dialog open={showBlockerDialog} onOpenChange={setShowBlockerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBlocker ? 'Edit Blocker' : 'Add Blocker'}</DialogTitle>
            <DialogDescription>Track an impediment blocking sprint progress.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); const payload = { ...blockerForm, diagram: undefined }; if (editingBlocker) updateBlockerMutation.mutate({ id: editingBlocker.id, data: payload }); else createBlockerMutation.mutate(payload); }} className="space-y-4">
            <div className="space-y-2">
              <label className="label">Title</label>
              <Input placeholder="Blocker title" value={blockerForm.title} onChange={(e) => setBlockerForm({ ...blockerForm, title: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="label">Description</label>
              <Textarea placeholder="Describe the blocker..." value={blockerForm.description} onChange={(e) => setBlockerForm({ ...blockerForm, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <label className="label">Priority</label>
              <Select value={blockerForm.priority} onChange={(v) => setBlockerForm({ ...blockerForm, priority: v })}>
                {['low', 'medium', 'high', 'critical'].map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </Select>
            </div>
            <DialogFooter className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" type="button" onClick={() => setShowBlockerDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={createBlockerMutation.isPending || updateBlockerMutation.isPending}>
                {(createBlockerMutation.isPending || updateBlockerMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : editingBlocker ? 'Save Changes' : 'Add Blocker'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}