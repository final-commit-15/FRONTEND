// src/components/dashboard/SystemHealth.tsx

import { useQuery } from '@tanstack/react-query';
import { systemApi } from '../../api/system';
import type { SystemHealth } from '../../types/api';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { Card } from '../../components/ui/Card';

export function SystemHealth() {
  const { data, isLoading, error } = useQuery<SystemHealth>({
    queryKey: ['system-health'],
    queryFn: systemApi.getHealth,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Card className="p-6 space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </Card>
    );
  }

  if (error || !data) {
    return (
      <ErrorState
        title="System health unavailable"
        description="Unable to retrieve AgentForge service health."
      />
    );
  }

  // Flat structure from SystemHealth
  const services = [
    { name: 'API', status: data.api_status },
    { name: 'Worker', status: data.worker_status },
    { name: 'Redis', status: data.redis_status },
    { name: 'Database', status: data.database_status },
    { name: 'AI Services', status: data.ai_status },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
      <div className="space-y-3">
        {services.map((service) => (
          <div key={service.name} className="flex items-center justify-between">
            <span className="text-sm text-base-300">{service.name}</span>
            <span
              className={cn(
                'flex items-center gap-2 text-sm font-medium',
                service.status === 'healthy'
                  ? 'text-success-500'
                  : service.status === 'degraded'
                  ? 'text-warning-500'
                  : 'text-error-500'
              )}
            >
              {service.status === 'healthy' && <CheckCircle2 size={16} />}
              {service.status === 'degraded' && <AlertCircle size={16} />}
              {service.status === 'down' && <XCircle size={16} />}
              {service.status}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function SystemStatusIndicator({ compact = false }: { compact?: boolean }) {
  const { data } = useQuery<SystemHealth>({
    queryKey: ['system-health'],
    queryFn: systemApi.getHealth,
    refetchInterval: 30000,
  });

  const isHealthy = data?.api_status === 'healthy' && data?.worker_status === 'healthy';

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full border px-3 py-1',
        isHealthy
          ? 'border-success-500/30 bg-success-500/10 text-success-500'
          : 'border-warning-500/30 bg-warning-500/10 text-warning-500'
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
      </span>
      {!compact && (
        <span className="text-xs font-medium">
          {isHealthy ? 'All Systems Operational' : 'Degraded'}
        </span>
      )}
    </div>
  );
}