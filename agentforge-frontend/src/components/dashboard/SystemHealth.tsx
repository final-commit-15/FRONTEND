import { useQuery } from '@tanstack/react-query';
import { systemApi } from '../../api/system';
import type { SystemHealth } from '../../types/api';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';

export function SystemHealth() {
  const { data, isLoading, error } = useQuery<SystemHealth>({
    queryKey: ['system-health'],
    queryFn: systemApi.getHealth,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <h3 className="font-heading text-lg font-semibold text-text-heading">System Health</h3>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <Skeleton variant="text" className="w-48" />
          <Skeleton variant="rectangular" className="h-10" />
          <Skeleton variant="rectangular" className="h-10" />
          <Skeleton variant="rectangular" className="h-10" />
          <Skeleton variant="rectangular" className="h-10" />
          <Skeleton variant="rectangular" className="h-10" />
        </CardContent>
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

  const services = [
    { name: 'API', status: data.api_status },
    { name: 'Worker', status: data.worker_status },
    { name: 'Redis', status: data.redis_status },
    { name: 'Database', status: data.database_status },
    { name: 'AI Services', status: data.ai_status },
  ];

  const getStatusStyle = (status: string) => {
    if (status === 'healthy') return { color: 'text-success-600', bg: 'bg-success-50', border: 'border-success-100', icon: CheckCircle2 };
    if (status === 'degraded') return { color: 'text-warning-600', bg: 'bg-warning-50', border: 'border-warning-100', icon: AlertCircle };
    return { color: 'text-error-600', bg: 'bg-error-50', border: 'border-error-100', icon: XCircle };
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <h3 className="font-heading text-lg font-semibold text-text-heading">System Health</h3>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {services.map((service) => {
          const style = getStatusStyle(service.status);
          const Icon = style.icon;
          return (
            <div key={service.name} className="flex items-center justify-between p-3 rounded-xl bg-canvas-surface border border-canvas-border">
              <span className="text-sm font-medium text-text-heading">{service.name}</span>
              <span className={cn('flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full', style.color, style.bg, style.border)}>
                <Icon size={14} />
                <span className="capitalize">{service.status}</span>
              </span>
            </div>
          );
        })}
      </CardContent>
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
        'flex items-center gap-2 rounded-full border px-3 py-1.5',
        isHealthy
          ? 'border-success-200 bg-success-50 text-success-600'
          : 'border-warning-200 bg-warning-50 text-warning-600'
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