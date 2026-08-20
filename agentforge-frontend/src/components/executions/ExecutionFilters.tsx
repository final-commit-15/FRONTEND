import React from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EXECUTION_STATUSES } from '@/lib/constants';

interface ExecutionFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

export function ExecutionFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
}: ExecutionFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-[200px]">
        <Input
          label="Search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by ID, agent, or task..."
        />
      </div>
      <div className="w-40">
        <Select label="Status" value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)}>
          <option value="all">All</option>
          {EXECUTION_STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </Select>
      </div>
      <div className="w-48">
        <Select label="Sort By" value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
          <option value="-started_at">Newest First</option>
          <option value="started_at">Oldest First</option>
          <option value="-duration">Longest Duration</option>
          <option value="duration">Shortest Duration</option>
        </Select>
      </div>
    </div>
  );
}