// src/pages/TaskDetailPage.tsx

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, MessageSquare, CheckSquare, Loader2 } from 'lucide-react';
import { tasksApi } from '@/api/tasks';
import { executionsApi } from '@/api/executions';
import { apiClient } from '@/api/client';
import type { Task } from '@/types/models';
import type { ExecutionListResponse } from '@/types/api';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { ExecutionList } from '@/components/executions/ExecutionList';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

function getStatusVariant(status: Task['status']): 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'warning';
    case 'failed':
      return 'error';
    default:
      return 'neutral';
  }
}

interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  content: string;
  parent_comment_id?: string | null;
  created_at?: string;
}

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const {
    data: task,
    isLoading,
    error,
    refetch,
  } = useQuery<Task>({
    queryKey: ['task', id],
    queryFn: () => tasksApi.get(id!),
    enabled: !!id,
  });

  const { data: executionsData } = useQuery<ExecutionListResponse>({
    queryKey: ['executions', { task_id: id }],
    queryFn: () => executionsApi.list({ task_id: id }),
    enabled: !!id,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery<TaskComment[]>({
    queryKey: ['task-comments', id],
    queryFn: () => apiClient.get<TaskComment[]>(`/tasks/${id}/comments`).then((r) => r.data),
    enabled: !!id,
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) =>
      apiClient.post(`/tasks/${id}/comments`, { content }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', id] });
      setCommentText('');
    },
  });

  const updateChecklistMutation = useMutation({
    mutationFn: (checklist: { text: string; done: boolean }[]) =>
      apiClient.patch(`/tasks/${id}/checklist`, { checklist }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="animate-fade-in">
        <Skeleton variant="title" className="w-56" />
        <Card>
          <CardContent className="pt-0">
            <Skeleton variant="card" className="h-72" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load task"
        description={(error as Error).message || 'Unknown error'}
        onRetry={refetch}
      />
    );
  }

  if (!task) {
    return (
      <ErrorState
        title="Task not found"
        description="Unable to retrieve this AgentForge task."
        onRetry={() => window.history.back()}
      />
    );
  }

  const executions = executionsData?.items ?? [];
  const checklist = task.checklist && Array.isArray(task.checklist)
    ? task.checklist.map((item: any) => typeof item === 'string' ? { text: item, done: false } : item)
    : [];

  const toggleChecklistItem = (index: number) => {
    const next = checklist.map((item: any, i: number) =>
      i === index ? { ...item, done: !item.done } : item
    );
    updateChecklistMutation.mutate(next);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={task.title}
        description="Task details and execution history"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={getStatusVariant(task.status)}>{task.status}</Badge>
        {task.priority && <Badge variant="outline">{task.priority}</Badge>}
        {task.category && <Badge variant="outline">{task.category}</Badge>}
        <span className="text-sm text-text-muted">Created {formatDateTime(task.created_at)}</span>
      </div>

      {task.description && <p className="mt-4 text-text-body">{task.description}</p>}

      {/* Checklist */}
      {checklist.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-heading text-lg font-semibold text-text-heading flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-brand-primary" />
              Checklist
              <Badge variant="outline" className="text-xs">
                {task.checklist_completed ?? checklist.filter((c: any) => c.done).length}/{checklist.length}
              </Badge>
            </h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {checklist.map((item: any, index: number) => (
                <label
                  key={index}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border border-canvas-border cursor-pointer transition-colors hover:bg-canvas-surface/50',
                    item.done && 'bg-canvas-surface/30'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleChecklistItem(index)}
                    disabled={updateChecklistMutation.isPending}
                    className="h-4 w-4 rounded border-canvas-border text-brand-primary focus:ring-brand-primary"
                  />
                  <span className={cn('text-sm text-text-body', item.done && 'line-through text-text-muted')}>
                    {typeof item === 'string' ? item : item.text}
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h3 className="font-heading text-lg font-semibold text-text-heading">Details</h3>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
              <dt className="text-sm text-text-muted">Assigned Agent</dt>
              <dd className="text-sm text-text-heading">
                {task.assigned_agent_name ? (
                  <Link to={`/agents/${task.assigned_agent_id}`} className="hover:text-brand-primary font-medium">
                    {task.assigned_agent_name}
                  </Link>
                ) : (
                  <span className="text-text-muted">Unassigned</span>
                )}
              </dd>
            </div>
            {task.github_pr_url && (
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                <dt className="text-sm text-text-muted">GitHub PR</dt>
                <dd className="text-sm text-text-heading">
                  <a
                    href={task.github_pr_url.startsWith('http') ? task.github_pr_url : `https://github.com/${task.github_pr_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-brand-primary font-medium text-brand-primary"
                  >
                    {task.github_pr_url}
                  </a>
                </dd>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
              <dt className="text-sm text-text-muted">Execution Count</dt>
              <dd className="text-sm font-mono font-medium text-text-heading">{task.execution_count}</dd>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
              <dt className="text-sm text-text-muted">Last Updated</dt>
              <dd className="text-sm text-text-heading">{formatDateTime(task.updated_at)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <h3 className="font-heading text-lg font-semibold text-text-heading flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-brand-primary" />
            Comments
            <Badge variant="outline" className="text-xs">{comments.length}</Badge>
          </h3>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Input
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && commentText.trim()) addCommentMutation.mutate(commentText.trim());
              }}
            />
            <Button
              variant="primary"
              size="icon"
              onClick={() => commentText.trim() && addCommentMutation.mutate(commentText.trim())}
              disabled={!commentText.trim() || addCommentMutation.isPending}
              aria-label="Post comment"
            >
              {addCommentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>

          {commentsLoading && (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} variant="text" className="w-full" />)}
            </div>
          )}

          {!commentsLoading && comments.length === 0 && (
            <p className="text-sm text-text-muted text-center py-6">No comments yet. Be the first to add one.</p>
          )}

          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="p-3.5 rounded-xl border border-canvas-border bg-canvas-surface/40">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-text-heading">{comment.user_name}</p>
                  <p className="text-xs text-text-muted">{comment.created_at ? formatDateTime(comment.created_at) : ''}</p>
                </div>
                <p className="text-sm text-text-body whitespace-pre-wrap">{comment.content}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-heading text-xl font-semibold text-text-heading mb-4">Executions</h2>
        {executions.length ? (
          <ExecutionList executions={executions} />
        ) : (
          <p className="text-text-muted">No executions for this task yet.</p>
        )}
      </div>
    </div>
  );
}