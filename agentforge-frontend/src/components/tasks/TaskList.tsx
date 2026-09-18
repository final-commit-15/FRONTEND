import React from 'react';
import { Link } from 'react-router-dom';
import { MoreVertical, Edit, Trash2, Eye, ExternalLink } from 'lucide-react';
import { Task } from '@/types/models';
import { Table, TableColumn } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { formatDate, formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';

interface TaskListProps {
  tasks: Task[];
  onDelete: (id: string) => void;
}

// Helper to safely access extra_data
function getExtraData(row: Task): Record<string, unknown> {
  return (row as unknown as { extra_data?: Record<string, unknown> }).extra_data ?? {};
}

function getStringExtra(row: Task, key: string): string {
  return String(getExtraData(row)[key] ?? '');
}

function getNumberExtra(row: Task, key: string): number {
  const val = getExtraData(row)[key];
  return typeof val === 'number' ? val : Number(val ?? 0);
}

export function TaskList({ tasks, onDelete }: TaskListProps) {
  const taskList = tasks ?? [];

  // ─── Table columns with all required fields ───
  const columns: TableColumn<Task>[] = [
    {
      key: 'title',
      label: 'Task Name',
      render: (_, row) => (
        <div>
          <Link to={`/tasks/${row.id}`} className="font-medium text-text-heading hover:text-brand-secondary">
            {row.title}
          </Link>
          {row.description && (
            <p className="text-xs text-text-muted mt-1 truncate max-w-xs">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Department',
      render: (_, row) => {
        const extra = getExtraData(row);
        const dept = String(extra.department ?? extra.feature_department ?? '—');
        return <span className="text-text-body capitalize">{dept}</span>;
      },
    },
    {
      key: 'assigned_agent_name',
      label: 'Assigned Agent',
      render: (_, row) => {
        const extra = getExtraData(row);
        const engineer = String(extra.assigned_engineer ?? '');
        const manualName = String(row.assignee_name ?? '');
        const manualEmail = String(row.assignee_email ?? '');
        if (engineer) return <span className="text-text-body">{engineer}</span>;
        if (manualName || manualEmail) {
          return (
            <span className="text-text-body">
              {manualName || manualEmail}
              {manualName && manualEmail ? ` · ${manualEmail}` : ''}
            </span>
          );
        }
        if (row.assigned_agent_id && row.assigned_agent_name) {
          return (
            <Link to={`/teams`} className="text-text-body hover:text-brand-secondary">
              {row.assigned_agent_name}
            </Link>
          );
        }
        return <span className="text-text-muted">Unassigned</span>;
      },
    },
    {
      key: 'assigned_member',
      label: 'Assigned Team Member',
      render: (_, row) => {
        const extra = getExtraData(row);
        const memberName = String(extra.assigned_member_name ?? extra.assignee_name ?? '');
        const memberEmail = String(extra.assigned_member_email ?? extra.assignee_email ?? '');
        if (memberName || memberEmail) {
          return (
            <span className="text-text-body">
              {memberName || memberEmail}
              {memberName && memberEmail ? ` · ${memberEmail}` : ''}
            </span>
          );
        }
        return <span className="text-text-muted">—</span>;
      },
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (value) => <StatusBadge status={String(value ?? 'medium')} />,
    },
    {
      key: 'sprint',
      label: 'Sprint',
      render: (_, row) => {
        const extra = getExtraData(row);
        return <span className="text-text-muted">{String(extra.sprint ?? extra.sprint_name ?? '—')}</span>;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (_, row) => {
        const checklist = (row as unknown as { checklist?: unknown[]; checklist_completed?: number }).checklist ?? [];
        const done = Number((row as unknown as { checklist_completed?: number }).checklist_completed ?? 0);
        const pct = checklist.length > 0 ? Math.round((done / checklist.length) * 100) : row.status === 'completed' ? 100 : 0;
        return <span className="tabular-nums text-text-muted">{pct}%</span>;
      },
    },
    {
      key: 'provider',
      label: 'Provider',
      render: (_, row) => {
        const extra = getExtraData(row);
        const provider = String(extra.provider ?? extra.ai_provider ?? '');
        if (!provider) return <span className="text-text-muted">—</span>;
        const label = provider === 'google-ai' ? 'Google AI' :
                      provider === 'groq' ? 'Groq' :
                      provider === 'openrouter' ? 'OpenRouter' :
                      provider === 'opencode-zen' ? 'OpenCode Zen' : provider;
        return <span className="text-text-body">{label}</span>;
      },
    },
    {
      key: 'model',
      label: 'Model',
      render: (_, row) => {
        const extra = getExtraData(row);
        const model = String(extra.model ?? extra.ai_model ?? '');
        return model ? <span className="font-mono text-sm text-text-body">{model}</span> : <span className="text-text-muted">—</span>;
      },
    },
    {
      key: 'retry_count',
      label: 'Retry Count',
      render: (_, row) => {
        const extra = getExtraData(row);
        const count = getNumberExtra(row, 'retry_count');
        if (count === 0) return <span className="text-text-muted">0</span>;
        return <span className={cn('font-mono', count > 2 ? 'text-amber-600' : 'text-text-body')}>{count}</span>;
      },
    },
    {
      key: 'latency',
      label: 'Latency',
      render: (_, row) => {
        const extra = getExtraData(row);
        const latency = getNumberExtra(row, 'latency_ms');
        if (latency === 0) return <span className="text-text-muted">—</span>;
        return <span className="tabular-nums text-text-muted">{latency}ms</span>;
      },
    },
    {
      key: 'github_issue',
      label: 'GitHub Issue',
      render: (_, row) => {
        const extra = getExtraData(row);
        const url = String(extra.github_issue_url ?? extra.github_url ?? '');
        if (!url) return <span className="text-text-muted">—</span>;
        return (
          <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-primary hover:underline">
            <ExternalLink size={14} />
            <span className="truncate max-w-[150px]">{url.replace(/^https?:\/\//, '').replace(/^github\.com\//, '')}</span>
          </a>
        );
      },
    },
    {
      key: 'id',
      label: '',
      render: (_, row) => (
        <Dropdown
          trigger={
            <button className="p-1.5 rounded-lg text-text-muted hover:text-text-heading hover:bg-canvas-surface transition-colors">
              <MoreVertical size={16} />
            </button>
          }
        >
          <div className="w-40 p-1">
            <Link
              to={`/tasks/${row.id}`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-text-body hover:bg-canvas-surface rounded-lg"
            >
              <Eye size={16} /> View
            </Link>
            <Link
              to={`/tasks/${row.id}/edit`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-text-body hover:bg-canvas-surface rounded-lg"
            >
              <Edit size={16} /> Edit
            </Link>
            <button
              onClick={() => onDelete(row.id)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-error-500 hover:bg-error-700/10 rounded-lg w-full text-left"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <Table columns={columns} data={taskList} />
      </div>
    </div>
  );
}