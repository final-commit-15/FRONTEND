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

// ─── Type for filter ─────────────────────────────────────────
type ActivityFilter = 'all' | 'agent' | 'task' | 'execution' | 'system';

// ─── Icon mapping ────────────────────────────────────────────
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

// ─── Skeleton loader ─────────────────────────────────────────
function ActivitySkeleton() {
  return (
    <Card className="p-6 space-y-3">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </Card>
  );
}

export function ActivityPage() {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // ── Query ──────────────────────────────────────────────────
  // Fetch all activity (filtering is done client‑side)
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

  // ── Client‑side filtering ────────────────────────────────
  const allActivities = data?.items ?? [];
  const filteredActivities = useMemo(() => {
    if (filter === 'all') return allActivities;
    return allActivities.filter((event) => event.type === filter);
  }, [allActivities, filter]);

  const total = data?.total ?? 0;
  const hasNext = allActivities.length === pageSize && total > page * pageSize;

  // ── Loading / error ───────────────────────────────────────
  if (isLoading) return <ActivitySkeleton />;
  if (error) {
    return (
      <ErrorState
        title="Unable to load activity"
        description={(error as Error).message || 'Activity feed is unavailable.'}
        onRetry={refetch}
      />
    );
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        description="Recent events across your platform."
      />

      {/* Filter tabs */}
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
                <Card key={event.id} className="p-4 flex items-start gap-4 hover:border-base-700 transition-colors">
                  <div className="p-2 rounded-lg bg-base-800">
                    <Icon size={18} className="text-electric-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{event.description}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-base-500">
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

          {/* Pagination controls */}
          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-base-500">
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