// src/pages/ProjectDetailPage.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, FileText, Sparkles as SparklesIcon, ListChecks, Brain, TrendingUp, Calendar, CalendarDays, Users, AlertCircle, CheckCircle, Clock, Building2, Mail, Briefcase, Target, TrendingUp as TrendingUpIcon, Loader2, ChevronDown, ChevronUp, Eye, Download } from 'lucide-react';
import { projectsApi } from '@/api/projects';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Separator } from '@/components/ui/Separator';
import { Skeleton } from '@/components/ui/Skeleton';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { AgentExecutionLog } from '@/components/intake/AgentExecutionLog';
import { ModelOwnership } from '@/components/intake/ModelOwnership';
import { AIDebugDrawer } from '@/components/intake/AIDebugDrawer';
import type { AIExecLog } from '@/hooks/useIntakePipeline';

interface ProjectDetailData {
  project: {
    id: string;
    name: string;
    description?: string;
    workspace_id: string;
    client_name?: string;
    client_email?: string;
    company?: string;
    project_priority?: string;
    expected_delivery_date?: string;
    team_members?: string[];
    member_count?: number;
    task_count?: number;
    sprint_count?: number;
    status?: string;
  };
  client_name?: string;
  client_email?: string;
  company?: string;
  project_priority?: string;
  expected_delivery_date?: string;
  team_members?: string[];
  requirements: Array<{
    id: string;
    title: string;
    description: string;
    priority: string;
    tags: string[];
  }>;
  features: Array<{
    id: string;
    title: string;
    description: string;
    epic: string;
    feature_key: string;
    priority: string;
    estimated_complexity: string;
    estimated_story_points: number;
    acceptance_criteria?: string[];
    actual_story_points?: number;
    parent_feature_id?: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    category: string;
    assignee_id?: string;
    deadline?: string;
    estimated_hours?: number;
    hours?: number;
    story_points?: number;
    estimated_start_date?: string;
    estimated_deadline?: string;
    sprint?: string;
    assigned_engineer?: string;
    dependencies: string[];
    skills: string[];
  }>;
  sprints: Array<{
    id: string;
    name: string;
    goal: string;
    start_date: string;
    end_date: string;
    story_points_planned: number;
    task_count: number;
    status: string;
  }>;
  timeline: {
    project: string;
    requirement_id: string;
    start_date: string;
    project_deadline: string;
    overall_duration_days: number;
    milestones: Array<{ name: string; date: string }>;
    sprints: Array<{
      id: string;
      name: string;
      start_date: string;
      deadline: string;
      task_count: number;
      story_points_planned: number;
    }>;
    tasks: Array<{
      id: string;
      title: string;
      assignee_id?: string;
      priority: string;
      status: string;
      story_points: number;
      estimated_hours: number;
      start_date: string;
      deadline: string;
      sprint: string;
      dependencies: string[];
    }>;
    dependencies: Array<{ task: string; depends_on: string[] }>;
    critical_path: string[];
  };
  monitoring?: {
    summary: string;
    health: string;
    recommendations: string[];
    model_used: string;
    updated_at?: string;
  };
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-error-500/20 text-error-500 border-error-500/30',
  high: 'bg-warning-500/20 text-warning-500 border-warning-500/30',
  medium: 'bg-info-500/20 text-info-500 border-info-500/30',
  low: 'bg-canvas-surface text-text-muted border-canvas-border',
};

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-success-500/20 text-success-500 border-success-500/30',
  in_progress: 'bg-warning-500/20 text-warning-500 border-warning-500/30',
  in_review: 'bg-info-500/20 text-info-500 border-info-500/30',
  todo: 'bg-canvas-surface text-text-muted border-canvas-border',
  blocked: 'bg-error-500/20 text-error-500 border-error-500/30',
  deferred: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
};

const HEALTH_COLORS: Record<string, string> = {
  healthy: 'bg-success-500/20 text-success-500 border-success-500/30',
  at_risk: 'bg-warning-500/20 text-warning-500 border-warning-500/30',
  delayed: 'bg-error-500/20 text-error-500 border-error-500/30',
};

const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  critical: <AlertCircle className="h-3.5 w-3.5" />,
  high: <Target className="h-3.5 w-3.5" />,
  medium: <Clock className="h-3.5 w-3.5" />,
  low: <ChevronDown className="h-3.5 w-3.5" />,
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

function formatRelative(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

function PriorityBadge({ priority }: { priority: string }) {
  const color = PRIORITY_COLORS[priority.toLowerCase()] || PRIORITY_COLORS.medium;
  const icon = PRIORITY_ICONS[priority.toLowerCase()];
  return (
    <Badge className={cn('gap-1 text-[11px]', color)}>
      {icon && <span>{icon}</span>}
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status.toLowerCase()] || STATUS_COLORS.todo;
  return <Badge className={cn('gap-1 text-[11px]', color)}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

function HealthBadge({ health, className }: { health: string; className?: string }) {
  const color = HEALTH_COLORS[health.toLowerCase()] || HEALTH_COLORS.healthy;
  return <Badge className={cn('gap-1 text-[11px]', color, className)}>{health.charAt(0).toUpperCase() + health.slice(1)}</Badge>;
}

function CollapsibleSection({ title, children, count, defaultOpen = false }: { title: string; children: React.ReactNode; count?: number; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details className="group" open={open}>
      <summary className="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-canvas-surface/50 border border-canvas-border transition-colors hover:bg-canvas-surface">
        <h4 className="font-semibold text-text-heading">{title}</h4>
        <div className="flex items-center gap-2">
          {count !== undefined && (
            <Badge variant="outline" className="text-xs">{count}</Badge>
          )}
          <ChevronDown className={cn('h-4 w-4 text-text-muted transition-transform', open && 'rotate-180')} />
        </div>
      </summary>
      <div className="mt-3 space-y-2 animate-in fade-in slide-down-from-top-2">
        {children}
      </div>
    </details>
  );
}

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inspectedLog, setInspectedLog] = useState<AIExecLog | null>(null);
  const execLogs: AIExecLog[] = [];

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    const fetchProject = async () => {
      try {
        setLoading(true);
        const data = await projectsApi.get(projectId);
        if (!cancelled) setProject(data);
      } catch (err) {
        if (!cancelled) setError('Failed to load project details');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProject();
    return () => { cancelled = true; };
  }, [projectId]);

  if (loading) {
    return (
      <div className="page-container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <Skeleton variant="title" className="w-64" />
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} variant="card" className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-error-600">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const { project: projectInfo, requirements, features, tasks, sprints, timeline, monitoring } = project;

  return (
    <div className="page-container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
            <ArrowLeft size={18} />
            Back
          </Button>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-heading font-heading">{projectInfo.name}</h1>
              <p className="text-sm text-text-muted">{projectInfo.member_count || 0} members · {projectInfo.task_count || 0} tasks · {projectInfo.sprint_count || 0} sprints</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {projectInfo.status && <Badge className={STATUS_COLORS[projectInfo.status] || 'bg-gray-500/20 text-gray-400'}>{projectInfo.status}</Badge>}
            <PriorityBadge priority={projectInfo.project_priority || 'medium'} />
            {monitoring && <HealthBadge health={monitoring.health} />}
          </div>
        </div>

      </div>
      {/* Client Info & Meta */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {projectInfo.client_name && (
          <Card className="p-4 border-canvas-border bg-canvas-surface/50">
            <div className="flex items-center gap-2 text-text-muted text-xs mb-1">Client Name</div>
            <p className="font-medium text-text-heading">{projectInfo.client_name}</p>
          </Card>
        )}
        {projectInfo.client_email && (
          <Card className="p-4 border-canvas-border bg-canvas-surface/50">
            <div className="flex items-center gap-2 text-text-muted text-xs mb-1">Client Email</div>
            <p className="font-medium text-text-heading">{projectInfo.client_email}</p>
          </Card>
        )}
        {projectInfo.company && (
          <Card className="p-4 border-canvas-border bg-canvas-surface/50">
            <div className="flex items-center gap-2 text-text-muted text-xs mb-1">Company</div>
            <p className="font-medium text-text-heading">{projectInfo.company}</p>
          </Card>
        )}
        {projectInfo.expected_delivery_date && (
          <Card className="p-4 border-canvas-border bg-canvas-surface/50">
            <div className="flex items-center gap-2 text-text-muted text-xs mb-1">Expected Delivery</div>
            <p className="font-medium text-text-heading">{formatDate(projectInfo.expected_delivery_date)}</p>
          </Card>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requirements">Requirements ({requirements.length})</TabsTrigger>
          <TabsTrigger value="features">Features ({features.length})</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="sprints">Sprints ({sprints.length})</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="prose prose-sm text-text-body max-w-none">
            <h3 className="text-lg font-semibold mb-3">Project Description</h3>
            <p className="whitespace-pre-wrap">{projectInfo.description || 'No description provided.'}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4 border-canvas-border bg-canvas-surface/50">
              <div className="text-xs text-text-muted mb-1">Total Tasks</div>
              <p className="text-2xl font-bold text-text-heading">{tasks.length}</p>
            </Card>
            <Card className="p-4 border-canvas-border bg-canvas-surface/50">
              <div className="text-xs text-text-muted mb-1">Features</div>
              <p className="text-2xl font-bold text-text-heading">{features.length}</p>
            </Card>
            <Card className="p-4 border-canvas-border bg-canvas-surface/50">
              <div className="text-xs text-text-muted mb-1">Sprints</div>
              <p className="text-2xl font-bold text-text-heading">{sprints.length}</p>
            </Card>
            <Card className="p-4 border-canvas-border bg-canvas-surface/50">
              <div className="text-xs text-text-muted mb-1">Timeline</div>
              <p className="text-2xl font-bold text-text-heading">{timeline?.overall_duration_days || 0} days</p>
            </Card>
            {monitoring && (
              <Card className="p-4 border-canvas-border bg-canvas-surface/50">
                <div className="text-xs text-text-muted mb-1">Health</div>
                <HealthBadge health={monitoring.health} />
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Requirements Tab */}
        <TabsContent value="requirements" className="space-y-4">
          {requirements.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <FileText size={48} className="mx-auto mb-3 text-text-muted/50" />
              <p className="text-text-muted">No requirements extracted yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requirements.map((req) => (
                <Card key={req.id} className="p-4 border-canvas-border hover:border-brand-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-text-heading truncate">{req.title}</h4>
                        <PriorityBadge priority={req.priority} />
                      </div>
                      <p className="text-sm text-text-muted line-clamp-2">{req.description}</p>
                      {req.tags && req.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {req.tags.slice(0, 5).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {req.tags && req.tags.length > 5 && (
                      <Badge variant="outline" className="text-xs shrink-0">+{req.tags.length - 5} more</Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          {features.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <SparklesIcon size={48} className="mx-auto mb-3 text-text-muted/50" />
              <p className="text-text-muted">No features extracted yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feat) => (
                <Card key={feat.id} className="p-4 border-canvas-border hover:border-brand-primary/30 transition-colors h-full">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-text-heading truncate">{feat.title}</h4>
                      <p className="text-xs text-text-muted mt-0.5">{feat.feature_key}</p>
                    </div>
                    <PriorityBadge priority={feat.priority} />
                  </div>
                  <p className="text-sm text-text-body line-clamp-2">{feat.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3 text-xs">
                    <Badge variant="outline">{feat.epic || 'No epic'}</Badge>
                    <Badge variant="outline">{feat.estimated_complexity} complexity</Badge>
                    <Badge variant="outline">{feat.estimated_story_points} SP</Badge>
                    <PriorityBadge priority={feat.priority} />
                  </div>
                  {feat.acceptance_criteria && feat.acceptance_criteria.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium text-text-muted">Acceptance Criteria:</p>
                      {feat.acceptance_criteria.slice(0, 3).map((ac: string, i: number) => (
                        <p key={i} className="text-xs text-text-muted flex items-center gap-1">
                          <span className="text-brand-primary">✓</span> {ac}
                        </p>
                      ))}
                      {feat.acceptance_criteria.length > 3 && (
                        <p className="text-xs text-text-muted">+{feat.acceptance_criteria.length - 3} more</p>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <ListChecks size={48} className="mx-auto mb-3 text-text-muted/50" />
              <p className="text-text-muted">No tasks generated yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <Card key={task.id} className="p-4 border-canvas-border hover:border-brand-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-text-heading truncate">{task.title}</h4>
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />
                      </div>
                      <p className="text-sm text-text-muted line-clamp-2">{task.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs">
                        <Badge variant="outline">{task.category}</Badge>
                        <Badge variant="outline">{task.sprint || 'Unassigned'}</Badge>
                        {task.assigned_engineer && <Badge variant="outline">{task.assigned_engineer}</Badge>}
                        <Badge variant="outline">{task.estimated_hours || task.hours}h</Badge>
                        <Badge variant="outline">{task.story_points || task.story_points} SP</Badge>
                        {task.deadline && <Badge variant="outline">Due: {formatDate(task.deadline)}</Badge>}
                      </div>
                      {task.dependencies && task.dependencies.length > 0 && (
                        <div className="mt-2 text-xs text-text-muted">
                          <span className="font-medium">Depends on:</span> {task.dependencies.join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {task.assignee_id && <Badge variant="outline">Assigned</Badge>}
                      {task.estimated_hours && <Badge variant="outline">{task.estimated_hours}h</Badge>}
                      {task.story_points && <Badge variant="outline">{task.story_points} SP</Badge>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Sprints Tab */}
        <TabsContent value="sprints" className="space-y-4">
          {sprints.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <CalendarDays size={48} className="mx-auto mb-3 text-text-muted/50" />
              <p className="text-text-muted">No sprints planned yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sprints.map((sprint) => (
                <Card key={sprint.id} className="p-4 border-canvas-border">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-text-heading">{sprint.name}</h4>
                      <p className="text-sm text-text-muted">{sprint.goal || 'No goal set'}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="outline">{sprint.task_count} tasks</Badge>
                      <Badge variant="outline">{sprint.story_points_planned} SP</Badge>
                      <StatusBadge status={sprint.status} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-text-muted">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={14} />
                      {formatDate(sprint.start_date)} – {formatDate(sprint.end_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUpIcon size={14} />
                      {sprint.story_points_planned} story points
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="p-5 border-canvas-border bg-gradient-to-br from-brand-primary/5 to-brand-accent/5">
              <div className="text-xs text-text-muted mb-1">Project Duration</div>
              <p className="text-3xl font-bold text-text-heading">{timeline?.overall_duration_days || 0} days</p>
            </Card>
            <Card className="p-5 border-canvas-border">
              <div className="text-xs text-text-muted mb-1">Start Date</div>
              <p className="text-lg font-semibold text-text-heading">{formatDate(timeline?.start_date)}</p>
            </Card>
            <Card className="p-5 border-canvas-border">
              <div className="text-xs text-text-muted mb-1">Project Deadline</div>
              <p className="text-lg font-semibold text-text-heading">{formatDate(timeline?.project_deadline)}</p>
            </Card>
          </div>

          <Separator className="my-4" />

          <div>
            <h3 className="text-lg font-semibold mb-4">Milestones</h3>
            <div className="space-y-3">
              {timeline?.milestones?.map((ms, i) => (
                <Card key={ms.name} className="p-4 border-canvas-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                      <TrendingUpIcon size={16} className="text-brand-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-text-heading">{ms.name}</p>
                      <p className="text-sm text-text-muted">{formatDate(ms.date)}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {i === 0 ? 'Start' : i === (timeline?.milestones?.length || 0) - 1 ? 'End' : `Milestone ${i}`}
                  </Badge>
                </Card>
              ))}
            </div>
          </div>

          <Separator className="my-4" />

          <div>
            <h3 className="text-lg font-semibold mb-4">Sprints</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {timeline?.sprints?.map((sprint) => (
                <Card key={sprint.id} className="p-4 border-canvas-border">
                  <h4 className="font-semibold text-text-heading mb-1">{sprint.name}</h4>
                  <p className="text-sm text-text-muted mb-3">{sprint.start_date} – {sprint.deadline}</p>
                  <div className="flex items-center gap-4 text-sm text-text-muted">
                    <span className="flex items-center gap-1"><CalendarDays size={12} /> {sprint.task_count} tasks</span>
                    <span className="flex items-center gap-1"><TrendingUpIcon size={12} /> {sprint.story_points_planned} SP</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          {monitoring ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-5 border-canvas-border bg-gradient-to-br from-brand-primary/5 to-brand-accent/5">
                  <div className="text-xs text-text-muted mb-1">Delivery Health</div>
                  <HealthBadge health={monitoring.health} className="text-lg" />
                </Card>
                <Card className="p-5 border-canvas-border">
                  <div className="text-xs text-text-muted mb-1">Model Used</div>
                  <p className="font-mono text-sm text-text-heading">{monitoring.model_used}</p>
                </Card>
                <Card className="p-5 border-canvas-border">
                  <div className="text-xs text-text-muted mb-1">Last Updated</div>
                  <p className="font-mono text-sm text-text-heading">{formatRelative(monitoring.updated_at)}</p>
                </Card>
              </div>

              <Separator className="my-4" />

              <div>
                <h3 className="text-lg font-semibold mb-4">AI Summary</h3>
                <Card className="p-5 border-canvas-border bg-canvas-surface/50">
                  <p className="text-text-body whitespace-pre-wrap">{monitoring.summary || 'No summary available.'}</p>
                </Card>
              </div>

              {monitoring.recommendations && monitoring.recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
                  <div className="space-y-3">
                    {monitoring.recommendations.map((rec, i) => (
                      <Card key={i} className="p-4 border-canvas-border flex items-start gap-3">
                        <span className="text-brand-primary font-bold">#{i + 1}</span>
                        <p className="text-text-body">{rec}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-text-muted">
              <TrendingUpIcon size={48} className="mx-auto mb-3 text-text-muted/50" />
              <p className="text-text-muted">No monitoring data available yet. Complete the pipeline to generate monitoring insights.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* AI Execution Log Panel */}
      {execLogs.length > 0 && (
        <AgentExecutionLog logs={execLogs} onInspect={setInspectedLog} />
      )}

      {/* AI Debug Drawer */}
      <AIDebugDrawer log={inspectedLog} onClose={() => setInspectedLog(null)} />
    </div>
  );
}