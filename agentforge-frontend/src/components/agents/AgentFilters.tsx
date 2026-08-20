import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AGENT_TYPES } from '@/lib/constants';

interface AgentFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

export function AgentFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  sortBy,
  onSortChange,
}: AgentFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-[200px]">
        <Input
          label="Search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search agents..."
          icon={<Search size={16} className="text-base-500" />}
        />
      </div>
      <div className="w-40">
        <Select label="Status" value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>
      <div className="w-40">
        <Select label="Type" value={typeFilter} onChange={(e) => onTypeFilterChange(e.target.value)}>
          <option value="all">All Types</option>
          {AGENT_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </Select>
      </div>
      <div className="w-48">
        <Select label="Sort By" value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
          <option value="-created_at">Newest</option>
          <option value="created_at">Oldest</option>
          <option value="-execution_count">Most Executions</option>
          <option value="name">Name A-Z</option>
        </Select>
      </div>
    </div>
  );
}