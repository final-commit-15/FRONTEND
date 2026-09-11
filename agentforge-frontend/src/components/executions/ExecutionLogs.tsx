// src/components/executions/ExecutionLogs.tsx

import { Download, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExecutionLog } from '@/types/models';
import { useToast } from '@/hooks/useToast';
import { formatDateTime } from '@/lib/format';

interface ExecutionLogsProps {
  logs?: ExecutionLog[];
}

export function ExecutionLogs({ logs = [] }: ExecutionLogsProps) {
  const { addToast } = useToast();

  const copyLogs = async () => {
    const text = logs
      .map((log) => `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`)
      .join('\n');
    await navigator.clipboard.writeText(text);
    addToast({ type: 'success', title: 'Logs copied to clipboard' });
  };

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-canvas-border flex items-center justify-between bg-canvas-surface">
        <h3 className="text-lg font-semibold text-text-heading">Logs</h3>
        <div className="flex gap-2">
          <button onClick={copyLogs} className="p-2 text-text-muted hover:text-text-heading transition-colors" aria-label="Copy logs">
            <Copy size={16} />
          </button>
          <button className="p-2 text-text-muted hover:text-text-heading transition-colors" aria-label="Download logs">
            <Download size={16} />
          </button>
        </div>
      </div>
      <div className="bg-bg-tertiary p-4 font-mono text-sm overflow-x-auto max-h-96 overflow-y-auto">
        {logs.map((log, index) => (
          <div key={index} className="flex gap-4 py-1">
            <span className="text-text-muted whitespace-nowrap">{formatDateTime(log.timestamp)}</span>
            <span
              className={cn(
                'font-medium',
                log.level === 'error' ? 'text-error-500' :
                log.level === 'warn' ? 'text-warning-500' :
                log.level === 'info' ? 'text-info-500' : 'text-text-muted'
              )}
            >
              [{log.level.toUpperCase()}]
            </span>
            <span className="text-text-body">{log.message}</span>
          </div>
        ))}
        {logs.length === 0 && <p className="text-text-muted">No logs available.</p>}
      </div>
    </div>
  );
}