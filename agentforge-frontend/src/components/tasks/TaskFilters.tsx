import React from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { TASK_STATUSES } from '@/lib/constants';
import { TaskStatus } from '@/types/models'; // or define locally

interface TaskFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: TaskStatus | 'all';
  onStatusFilterChange: (value: TaskStatus | 'all') => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

export function TaskFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-[200px]">
        <Input
          label="Search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks..."
        />
      </div>
      <div className="w-40">
        <Select
          label="Status"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as TaskStatus | 'all')}
        >
          <option value="all">All</option>
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-48">
        <Select label="Sort By" value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
          <option value="-created_at">Newest</option>
          <option value="created_at">Oldest</option>
          <option value="name">Name A-Z</option>
        </Select>
      </div>
    </div>
  );
}