// src/pages/ActivityPage.tsx

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { activityApi } from '@/api/activity';
import type { ActivityEvent } from '@/types/api';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { formatDateTime } from '@/lib/format';
import {
  Bot,
  ListChecks,
  TerminalSquare,
  Settings,
  User,
  Plus,
  Edit,
  Trash2,
  Play,
} from 'lucide-react';

type ActivityFilter = 'all' | 'agent' | 'task' | 'execution' | 'system';

const eventIcons: Record<string, React.ElementType> = {
  agent_created: Plus,
  agent_updated: Edit,
  agent_deleted: Trash2,
  agent_executed: Play,
  task_created: ListChecks,
  execution_completed: TerminalSquare,
  execution_failed: TerminalSquare,
  settings_changed: Settings,
  default: User,
};

export function ActivityPage() {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['activity', page],
    queryFn: () =>
      activityApi.list({
        page,
        limit: pageSize,
      }),
    refetchInterval: 30000,
  });

  const allActivities = data?.items ?? [];
  const filteredActivities = useMemo(() => {
    if (filter === 'all') return allActivities;
    return allActivities.filter((event) => event.type === filter);
  }, [allActivities, filter]);

  const total = data?.total ?? 0;
  const hasNext = allActivities.length === pageSize && total > page * pageSize;

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <Skeleton variant="title" className="w-56" />
        <Card>
          <div className="p-6 space-y-3">
            <Skeleton variant="rectangular" className="h-12" />
            <Skeleton variant="rectangular" className="h-12" />
            <Skeleton variant="rectangular" className="h-12" />
            <Skeleton variant="rectangular" className="h-12" />
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load activity"
        description={(error as Error).message || 'Activity feed is unavailable.'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Activity"
        description="Recent events across your platform."
      />

      <div className="flex flex-wrap gap-2">
        {(['all', 'agent', 'task', 'execution', 'system'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {filteredActivities.length === 0 ? (
        <EmptyState
          title="No activity matches your filter"
          description="Try adjusting the filter or wait for new events."
        />
      ) : (
        <>
          <div className="space-y-3">
            {filteredActivities.map((event) => {
              const Icon = eventIcons[event.type] || eventIcons.default;
              return (
                <Card key={event.id} className="card-hover p-4 flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-brand-primary/10">
                    <Icon size={18} className="text-brand-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-heading">{event.description}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-text-muted">
                      <span>{event.user_name}</span>
                      <span>•</span>
                      <span>{formatDateTime(event.timestamp)}</span>
                    </div>
                  </div>
                  {event.related_entity && (
                    <Badge variant="neutral" className="shrink-0">
                      {event.related_entity.type}: {event.related_entity.name}
                    </Badge>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-text-muted">
              Showing {filteredActivities.length} of {total} events
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNext}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}