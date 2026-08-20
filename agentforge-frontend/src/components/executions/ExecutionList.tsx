// src/components/executions/ExecutionList.tsx

import React from 'react';
import { Link } from 'react-router-dom';
import { TerminalSquare, MoreVertical, RotateCcw, XCircle } from 'lucide-react';
import type { Execution } from '@/types/models';
import { Table, TableColumn } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { formatDateTime, formatDuration } from '@/lib/format';

interface ExecutionListProps {
  executions?: Execution[];
  onRetry?: (id: string) => void;
  onCancel?: (id: string) => void;
}

function getStatusVariant(status: Execution['status']): 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case 'completed':
      return 'success';
    case 'running':
      return 'warning';
    case 'failed':
      return 'error';
    default:
      return 'neutral';
  }
}

export function ExecutionList({ executions = [], onRetry, onCancel }: ExecutionListProps) {
  if (executions.length === 0) {
    return <p className="text-base-500">No executions found.</p>;
  }

  const columns: TableColumn<Execution>[] = [
    {
      key: 'id',
      label: 'ID',
      render: (_, row) => (
        <Link to={`/executions/${row.id}`} className="font-mono text-xs hover:text-electric-400">
          {row.id.slice(0, 8)}...
        </Link>
      ),
    },
    {
      key: 'agent_name',
      label: 'Agent',
      render: (_, row) => (
        <Link to={`/agents/${row.agent_id}`} className="hover:text-electric-400">
          {row.agent_name}
        </Link>
      ),
    },
    {
      key: 'task_name',
      label: 'Task',
      render: (_, row) => (
        <Link to={`/tasks/${row.task_id}`} className="hover:text-electric-400">
          {row.task_name}
        </Link>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge>,
    },
    {
      key: 'started_at',
      label: 'Started',
      render: (value) => <span className="text-base-400">{formatDateTime(value as string)}</span>,
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (value) => <span>{formatDuration(value as number)}</span>,
    },
    {
      key: 'id',
      label: '',
      render: (_, row) => (
        <Dropdown
          trigger={
            <button className="p-1.5 rounded-lg text-base-500 hover:text-white hover:bg-base-800 transition-colors">
              <MoreVertical size={16} />
            </button>
          }
        >
          <div className="w-40 p-1">
            {(row.status === 'failed' || row.status === 'cancelled') && onRetry && (
              <button
                onClick={() => onRetry(row.id)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-base-300 hover:bg-base-800 rounded-lg w-full text-left"
              >
                <RotateCcw size={16} /> Retry
              </button>
            )}
            {(row.status === 'queued' || row.status === 'running') && onCancel && (
              <button
                onClick={() => onCancel(row.id)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-error-500 hover:bg-error-700/10 rounded-lg w-full text-left"
              >
                <XCircle size={16} /> Cancel
              </button>
            )}
            <Link
              to={`/executions/${row.id}`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-base-300 hover:bg-base-800 rounded-lg"
            >
              <TerminalSquare size={16} /> View Details
            </Link>
          </div>
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <Table columns={columns} data={executions} />
      </div>
    </div>
  );
}