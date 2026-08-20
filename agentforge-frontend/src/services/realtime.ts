import { useWebSocket } from '@/hooks/useWebSocket';

export function useExecutionRealtime(executionId?: string) {
  const path = executionId ? `/ws/executions/${executionId}` : '/ws/executions';
  return useWebSocket(path);
}

export function useSystemRealtime() {
  return useWebSocket('/ws/system');
}