// src/pages/SprintsPage.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, CalendarDays, Target, Flag, Trash2, Edit,
  Loader2, CheckCircle2, BarChart3, Clock, Pin, ArrowRight,
  AlertCircle, FileText, Link2, ChevronDown, Filter, MoreHorizontal,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

import { requirementsApi } from '@/api/requirements';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
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

function SprintCard({
  sprint,
  onEdit,
  onStart,
  onComplete,
  isActive,
  onSetActive,
}: {
  sprint: any;
  onEdit: () => void;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  isActive: boolean;
  onSetActive: () => void;
}) {
  const statusColor = SPRINT_STATUS_COLORS[sprint.status] || SPRINT_STATUS_COLORS.planned;
  const daysLeft = sprint.end_date ? differenceInDays(new Date(sprint.end_date), new Date()) : 0;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-brand-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-text-heading truncate">{sprint.name}</h3>
              <p className="text-sm text-text-muted">{sprint.goal || 'No goal set'}</p>
            </div>
          </div>
          <Badge className={statusColor}>{sprint.status}</Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-text-muted mb-4">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {sprint.start_date ? format(new Date(sprint.start_date), 'MMM d, yyyy') : 'TBD'} → {sprint.end_date ? format(new Date(sprint.end_date), 'MMM d, yyyy') : 'TBD'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : daysLeft === 0 ? 'Ends today' : `${daysLeft} days remaining`}
          </span>
        </div>
        {sprint.description && (
          <p className="text-text-body text-sm mb-3 line-clamp-2">{sprint.description}</p>
        )}
        <div className="flex flex-wrap gap-2 text-[11px] text-text-muted mb-1">
          <span>{Array.isArray(sprint.deliverables) ? sprint.deliverables.length : 0} deliverables</span>
          <span>·</span>
          <span>{Array.isArray(sprint.milestones) ? sprint.milestones.length : 0} milestones</span>
          <span>·</span>
          <span>{Array.isArray(sprint.risks) ? sprint.risks.length : 0} risks</span>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-canvas-border flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="gap-1" onClick={onSetActive}>
            <Target className="h-3.5 w-3.5" />
            <span>{isActive ? 'Active' : 'Set Active'}</span>
          </Button>
        </div>
        <div className="flex gap-1">
          {sprint.status === 'planned' && (
            <Button variant="primary" size="sm" className="gap-1" onClick={() => onStart(sprint.id)}>
              <Flag className="h-3.5 w-3.5" />
              <span>Start</span>
            </Button>
          )}
          {sprint.status === 'active' && (
            <Button variant="outline" size="sm" className="gap-1" onClick={() => onComplete(sprint.id)}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Complete</span>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit sprint">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SprintsPageContent() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'planned' | 'active' | 'completed' | 'paused' | 'archived'>('all');
  const [showSprintDialog, setShowSprintDialog] = useState(false);
  const [editingSprint, setEditingSprint] = useState<any>(null);
  const [sprintForm, setSprintForm] = useState({ name: '', goal: '', description: '', start_date: '', end_date: '', deliverables: '', milestones: '', risks: '' });
  const [activeSprintId, setActiveSprintId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sprints', { search, statusFilter }],
    queryFn: () => requirementsApi.listSprints({ limit: 50, status: statusFilter === 'all' ? undefined : statusFilter }),
    retry: false,
  });

  const createSprintMutation = useMutation({
    mutationFn: (payload: any) => requirementsApi.createSprint(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      setActiveSprintId(data.id);
      setShowSprintDialog(false);
      setSprintForm({ name: '', goal: '', description: '', start_date: '', end_date: '', deliverables: '', milestones: '', risks: '' });
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

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton variant="title" className="w-72" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const sprintResponse = data as unknown as { items?: any[] } | any[] | undefined;
  const sprints: any[] = Array.isArray(sprintResponse)
    ? sprintResponse
    : Array.isArray(sprintResponse?.items)
      ? (sprintResponse?.items as any[])
      : [];

  const filteredSprints = sprints.filter((s: any) =>
    String(s.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    String(s.goal ?? '').toLowerCase().includes(search.toLowerCase()) ||
    String(s.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-heading">Sprints</h1>
          <p className="text-text-body mt-1">Manage sprints for your projects. First sprint is AI-generated; subsequent sprints managed by PM.</p>
        </div>
        <Button onClick={() => { setEditingSprint(null); setSprintForm({ name: `Sprint ${sprints.length + 1}`, goal: '', description: '', start_date: new Date().toISOString().split('T')[0], end_date: '', deliverables: '', milestones: '', risks: '' }); setShowSprintDialog(true); }} icon={<Plus size={18} />}>
          New Sprint
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Input placeholder="Search sprints..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
        </div>
        <div className="flex gap-2">
          {(['all', 'planned', 'active', 'completed', 'paused', 'archived'] as const).map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {filteredSprints.length === 0 ? (
        <EmptyState
          title={search ? 'No matching sprints' : 'No sprints yet'}
          description={search ? 'Try adjusting your search' : 'Create your first sprint to start planning development.'}
          icon={<CalendarDays className="h-12 w-12" />}
          action={
            <Button onClick={() => { setEditingSprint(null); setSprintForm({ name: 'Sprint 1', goal: '', description: '', start_date: new Date().toISOString().split('T')[0], end_date: '', deliverables: '', milestones: '', risks: '' }); setShowSprintDialog(true); }} icon={<Plus size={18} />}>
              Create Sprint
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSprints.map((sprint: any) => (
            <SprintCard
              key={String(sprint.id)}
              sprint={sprint}
              onEdit={() => { const arr = (v: any) => Array.isArray(v) ? v.join(', ') : String(v ?? ''); setEditingSprint(sprint); setSprintForm({ name: sprint.name, goal: sprint.goal || '', description: sprint.description || '', start_date: sprint.start_date || '', end_date: sprint.end_date || '', deliverables: arr(sprint.deliverables), milestones: arr(sprint.milestones), risks: arr(sprint.risks) }); setShowSprintDialog(true); }}
              onStart={startSprintMutation.mutate}
              onComplete={completeSprintMutation.mutate}
              isActive={activeSprintId === sprint.id}
              onSetActive={() => setActiveSprintId(String(sprint.id))}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Sprint Dialog */}
      <Dialog open={showSprintDialog} onOpenChange={setShowSprintDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSprint ? 'Edit Sprint' : 'Create Sprint'}</DialogTitle>
            <DialogDescription>Define goals and timeline for this sprint.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); const split = (v: string) => v.split(',').map((x) => x.trim()).filter(Boolean); const payload = { ...sprintForm, deliverables: split(sprintForm.deliverables), milestones: split(sprintForm.milestones), risks: split(sprintForm.risks) }; if (editingSprint) updateSprintMutation.mutate({ id: editingSprint.id, data: payload }); else createSprintMutation.mutate(payload); }} className="space-y-4">
            <div className="space-y-2">
              <label className="label">Sprint Name</label>
              <Input placeholder="Sprint 1 - User Authentication" value={sprintForm.name} onChange={(e) => setSprintForm({ ...sprintForm, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="label">Goal</label>
              <Textarea placeholder="Sprint goal..." value={sprintForm.goal} onChange={(e) => setSprintForm({ ...sprintForm, goal: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <label className="label">Description (optional)</label>
              <Textarea placeholder="Sprint description..." value={sprintForm.description} onChange={(e) => setSprintForm({ ...sprintForm, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <label className="label">Deliverables (comma separated)</label>
              <Textarea placeholder="Login API, QR scanner, attendance report" value={sprintForm.deliverables} onChange={(e) => setSprintForm({ ...sprintForm, deliverables: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <label className="label">Milestones (comma separated)</label>
              <Textarea placeholder="M1: Auth done, M2: QA sign-off" value={sprintForm.milestones} onChange={(e) => setSprintForm({ ...sprintForm, milestones: e.target.value })} rows={2} />
            </div>
            <div className="space-y-2">
              <label className="label">Risks (comma separated)</label>
              <Textarea placeholder="Face-recognition accuracy, device coverage" value={sprintForm.risks} onChange={(e) => setSprintForm({ ...sprintForm, risks: e.target.value })} rows={2} />
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
    </div>
  );
}
 
export function SprintsPage() {
  return <SprintsPageContent />;
}