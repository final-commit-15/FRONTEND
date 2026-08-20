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
      key: 'name',
      label: 'Name',
      render: (_, row) => (
        <div>
          <Link to={`/tasks/${row.id}`} className="font-medium text-white hover:text-electric-400">
            {row.name}
          </Link>
          {row.description && (
            <p className="text-xs text-base-500 mt-1 truncate max-w-xs">{row.description}</p>
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
            <Link to={`/agents/${row.assigned_agent_id}`} className="hover:text-electric-400">
              {row.assigned_agent_name}
            </Link>
          );
        }
        return <span className="text-base-500">Unassigned</span>;
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
      render: (value) => <span className="text-base-400">{formatDate(value as string)}</span>,
    },
    {
      key: 'updated_at',
      label: 'Updated',
      render: (value) => <span className="text-base-400">{formatRelativeTime(value as string)}</span>,
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
            <Link
              to={`/tasks/${row.id}`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-base-300 hover:bg-base-800 rounded-lg"
            >
              <Eye size={16} /> View
            </Link>
            <Link
              to={`/tasks/${row.id}/edit`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-base-300 hover:bg-base-800 rounded-lg"
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