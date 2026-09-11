// src/components/executions/ExecutionLiveStatus.tsx

import type { Execution } from '@/types/models';

interface ExecutionLiveStatusProps {
  execution: Execution;
}

export function ExecutionLiveStatus({ execution }: ExecutionLiveStatusProps) {
  const isLive = execution.status === 'running' || execution.status === 'queued';

  if (!isLive) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-primary" />
      </span>
      <span className="text-brand-secondary font-medium">Live</span>
    </div>
  );
}