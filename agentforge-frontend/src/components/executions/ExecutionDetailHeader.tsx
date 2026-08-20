import React from 'react';
import { Link } from 'react-router-dom';
import { TerminalSquare, RotateCcw, XCircle, RefreshCw } from 'lucide-react';
import { Execution } from '@/types/models';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { formatDateTime, formatDuration } from '@/lib/format';

interface ExecutionDetailHeaderProps {
  execution: Execution;
  onRefresh: () => void;
  onRetry?: () => void;
  onCancel?: () => void;
}

export function ExecutionDetailHeader({ execution, onRefresh, onRetry, onCancel }: ExecutionDetailHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-electric-500/20 to-violet-500/20 flex items-center justify-center">
          <TerminalSquare size={24} className="text-electric-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white font-mono">{execution.id.slice(0, 8)}...</h1>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={execution.status} />
            <span className="text-base-600">•</span>
            <span className="text-sm text-base-500">Started {formatDateTime(execution.started_at)}</span>
            <span className="text-base-600">•</span>
            <span className="text-sm text-base-500">Duration {formatDuration(execution.duration)}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" icon={<RefreshCw size={16} />} onClick={onRefresh}>
          Refresh
        </Button>
        {(execution.status === 'failed' || execution.status === 'cancelled') && onRetry && (
          <Button icon={<RotateCcw size={16} />} onClick={onRetry}>
            Retry
          </Button>
        )}
        {(execution.status === 'queued' || execution.status === 'running') && onCancel && (
          <Button variant="danger" icon={<XCircle size={16} />} onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}