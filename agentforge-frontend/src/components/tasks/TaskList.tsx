import React from 'react';
import { Link } from 'react-router-dom';
import { MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { Task } from '@/types/models';
import { Table, TableColumn } from '@/components/ui/Table';
import { StatusBadge } from '@/components/ui/Badge';
import { Dropdown } from '@/components/ui/Dropdown';
import { formatDate, formatRelativeTime } from '@/lib/format';

interface TaskListProps {
  tasks: Task[];
  onDelete: (id: string) => void;
}

export function TaskList({ tasks, onDelete }: TaskListProps) {
  const taskList = tasks ?? [];

  // ─── Table columns ──────────────────────────────────────────
  const columns: TableColumn<Task>[] = [
{
      key: 'title',
      label: 'Title',
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
      key: 'status',
      label: 'Status',
      render: (_, row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'assigned_agent_name',
      label: 'Assigned Agent',
      render: (_, row) => {
        if (row.assigned_agent_id && row.assigned_agent_name) {
          return (
            <Link to={`/agents/${row.assigned_agent_id}`} className="text-text-body hover:text-brand-secondary">
              {row.assigned_agent_name}
            </Link>
          );
        }
        return <span className="text-text-muted">Unassigned</span>;
      },
    },
    {
      key: 'execution_count',
      label: 'Executions',
      render: (value) => <span>{value ?? 0}</span>,
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (value) => <span className="text-text-muted">{formatDate(value as string)}</span>,
    },
    {
      key: 'updated_at',
      label: 'Updated',
      render: (value) => <span className="text-text-muted">{formatRelativeTime(value as string)}</span>,
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