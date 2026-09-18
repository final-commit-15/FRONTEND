// src/pages/TimelinePage.tsx

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CalendarDays, TrendingUp, Flag, GitMerge, Clock, Users,
  AlertCircle, CheckCircle2, ArrowRight, Sparkles, ListChecks,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Separator } from '@/components/ui/Separator';
import { projectsApi } from '@/api/projects';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimelineProject {
  project: { id: string; name: string; status?: string; project_priority?: string };
  timeline: {
    project: string;
    start_date: string;
    project_deadline: string;
    overall_duration_days: number;
    milestones: Array<{ name: string; date: string }>;
    sprints: Array<{
      id: string; name: string; start_date: string; deadline: string;
      task_count: number; story_points_planned: number;
    }>;
    tasks: Array<{
      id: string; title: string; start_date: string; deadline: string;
      priority: string; status: string; story_points: number; sprint: string;
    }>;
    dependencies: Array<{ task: string; depends_on: string[] }>;
    critical_path: string[];
  };
}

const PRIORITY: Record<string, string> = {
  critical: 'bg-error-500/20 text-error-500 border-error-500/30',
  high: 'bg-warning-500/20 text-warning-500 border-warning-500/30',
  medium: 'bg-info-500/20 text-info-500 border-info-500/30',
  low: 'bg-canvas-surface text-text-muted border-canvas-border',
};

function fmt(date?: string): string {
  if (!date) return '—';
  try {
    return format(new Date(date), 'MMM d, yyyy');
  } catch {
    return date;
  }
}

export function TimelinePage() {
  const [selectedId, setSelectedId] = useState<string>('');

  const { data: projects } = useQuery({
    queryKey: ['projects', 'timeline-list'],
    queryFn: () => projectsApi.list(),
    retry: false,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['projects', 'detail', selectedId],
    queryFn: () => projectsApi.get(selectedId),
    enabled: !!selectedId,
    retry: false,
  });

  const projectList = Array.isArray(projects) ? projects : [];
  const timeline = (data as TimelineProject | undefined)?.timeline;
  const projectMeta = (data as TimelineProject | undefined)?.project;

  const sortedSprints = [...(timeline?.sprints || [])].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );

  const tasks = timeline?.tasks || [];
  const criticalPath = timeline?.critical_path || [];

  return (
    <div className="page-container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Timeline"
        description="AI-generated project delivery timeline: milestones, sprints, tasks, and critical path."
        action={
          <div className="flex items-center gap-3">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="h-10 px-3 pr-8 rounded-xl bg-canvas-surface border border-canvas-border text-sm text-text-heading focus:outline-none focus:border-brand-primary"
            >
              <option value="">Select a project...</option>
              {projectList.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {selectedId && (
              <Link
                to={`/projects/${selectedId}?tab=timeline`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-canvas-border text-text-heading hover:bg-canvas-glass transition-colors"
              >
                Open project <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        }
      />

      {!selectedId && (
        <Card className="p-12 text-center border-dashed border-canvas-border">
          <CalendarDays size={48} className="mx-auto mb-4 text-text-muted/40" />
          <p className="text-text-muted">Select a project above to view its AI-generated delivery timeline.</p>
        </Card>
      )}

      {selectedId && isLoading && (
        <div className="animate-pulse space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="card" className="h-24" />)}
          </div>
          <Skeleton variant="card" className="h-64" />
        </div>
      )}

      {selectedId && isError && !isLoading && (
        <Card className="p-8 text-center">
          <AlertCircle size={40} className="mx-auto mb-3 text-error-500/60" />
          <p className="text-text-muted">Failed to load the timeline. The project may not have AI artifacts yet.</p>
        </Card>
      )}

      {selectedId && timeline && !isLoading && (
        <div className="space-y-8">
          {/* Summary cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-5 bg-gradient-to-br from-brand-primary/10 to-brand-accent/10 border-canvas-border">
              <div className="text-xs text-text-muted mb-1">Project Duration</div>
              <p className="text-2xl font-bold text-text-heading">{timeline.overall_duration_days ?? 0} days</p>
            </Card>
            <Card className="p-5 border-canvas-border">
              <div className="text-xs text-text-muted mb-1">Start</div>
              <p className="text-lg font-semibold text-text-heading">{fmt(timeline.start_date)}</p>
            </Card>
            <Card className="p-5 border-canvas-border">
              <div className="text-xs text-text-muted mb-1">Deadline</div>
              <p className="text-lg font-semibold text-text-heading">{fmt(timeline.project_deadline)}</p>
            </Card>
            <Card className="p-5 border-canvas-border">
              <div className="text-xs text-text-muted mb-1">Milestones</div>
              <p className="text-2xl font-bold text-text-heading">{timeline.milestones?.length || 0}</p>
            </Card>
          </div>

          {/* Milestones */}
          <div>
            <h3 className="text-lg font-semibold text-text-heading mb-4 flex items-center gap-2">
              <Flag className="h-5 w-5 text-brand-primary" /> Milestones
            </h3>
            {timeline.milestones && timeline.milestones.length > 0 ? (
              <div className="relative ml-3 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-canvas-border">
                {timeline.milestones.map((ms, i) => (
                  <div key={ms.name} className="relative flex items-start gap-4 pl-8">
                    <span className="absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-brand-primary bg-canvas flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                    </span>
                    <Card className="flex-1 p-4 border-canvas-border hover:border-brand-primary/30 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-text-heading">{ms.name}</p>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {i === 0 ? 'Project start' : i === (timeline.milestones.length - 1) ? 'Project end' : `Milestone ${i}`}
                        </Badge>
                      </div>
                      <p className="text-sm text-text-muted mt-1 flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" /> {fmt(ms.date)}
                      </p>
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No milestones defined.</p>
            )}
          </div>

          <Separator />

          {/* Sprints on a horizontal bar */}
          <div>
            <h3 className="text-lg font-semibold text-text-heading mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-primary" /> Sprint Plan
            </h3>
            {sortedSprints.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {sortedSprints.map((s, i) => (
                  <Card key={s.id} className="flex-1 min-w-[220px] p-4 border-canvas-border">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">{`Sprint ${i + 1}`}</Badge>
                      <Badge variant="outline" className="text-xs">{s.story_points_planned} SP</Badge>
                    </div>
                    <p className="font-medium text-text-heading text-sm mb-2">{s.name}</p>
                    <p className="text-xs text-text-muted mb-2">
                      {fmt(s.start_date)} — {fmt(s.deadline)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <ListChecks className="h-3.5 w-3.5" /> {s.task_count} tasks
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No sprints generated yet.</p>
            )}
          </div>

          <Separator />

          {/* Tasks grouped by sprint */}
          <div>
            <h3 className="text-lg font-semibold text-text-heading mb-4 flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-brand-primary" /> Tasks &amp; Dependencies
            </h3>
            {tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map((t) => (
                  <Card key={t.id} className="p-3.5 border-canvas-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        criticalPath.includes(t.title) ? 'bg-error-600' : 'bg-brand-primary'
                      )} />
                      <p className="text-sm font-medium text-text-heading truncate">{t.title}</p>
                      {criticalPath.includes(t.title) && (
                        <Badge className="text-[10px] bg-error-500/20 text-error-500 border-error-500/30">Critical path</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={cn('text-[10px]', PRIORITY[t.priority] || PRIORITY.medium)}>
                        {t.priority?.charAt(0).toUpperCase() + t.priority?.slice(1) || 'Medium'}
                      </Badge>
                      <span className="text-xs text-text-muted hidden sm:flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {fmt(t.deadline)}
                      </span>
                      <span className="text-xs text-text-muted">{t.sprint || 'Unassigned'}</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No tasks generated yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Prompt hint */}
      {selectedId && !timeline && !isLoading && !isError && (
        <Card className="p-8 text-center">
          <Sparkles size={40} className="mx-auto mb-3 text-brand-primary/60" />
          <p className="text-text-muted">
            No timeline has been generated for this project yet. Run the AI pipeline from the{' '}
            <Link to="/agents" className="text-brand-primary hover:underline">AI Project Intake</Link>{' '}
            to produce requirements, sprints, and a delivery timeline.
          </p>
        </Card>
      )}
    </div>
  );
}