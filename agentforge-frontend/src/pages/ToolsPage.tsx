// src/pages/ToolsPage.tsx

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toolsApi } from '@/api/tools';
import type { Tool } from '@/types/api';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Table, TableColumn } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

// ─── Skeleton ──────────────────────────────────────────────
function ToolsSkeleton() {
  return (
    <Card className="p-6 space-y-3">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-32 ml-auto" />
      </div>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </Card>
  );
}

// ─── Category badge helper ────────────────────────────────
function getCategoryVariant(category: string): 'success' | 'warning' | 'info' | 'neutral' {
  switch (category?.toLowerCase()) {
    case 'ai':
    case 'machine learning':
      return 'success';
    case 'system':
    case 'infrastructure':
      return 'warning';
    case 'integration':
    case 'api':
      return 'info';
    default:
      return 'neutral';
  }
}

export function ToolsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const {
    data: tools,
    isLoading,
    error,
    refetch,
  } = useQuery<Tool[]>({
    queryKey: ['tools', category, search],
    queryFn: () =>
      toolsApi.list({
        category: category === 'all' ? undefined : category,
      }),
  });

  if (isLoading) return <ToolsSkeleton />;
  if (error) {
    return (
      <ErrorState
        title="Unable to load tools"
        description={(error as Error).message || 'Tools could not be retrieved.'}
        onRetry={refetch}
      />
    );
  }

  // ─── Safe array extraction ──────────────────────────────
  const rawTools = tools;
  const allTools = (() => {
    if (Array.isArray(rawTools)) return rawTools;
    if (rawTools && typeof rawTools === 'object') {
      const obj = rawTools as Record<string, unknown>;
      if (Array.isArray(obj.items)) return obj.items;
      if (Array.isArray(obj.data)) return obj.data;
      if (Array.isArray(obj.results)) return obj.results;
    }
    return [];
  })();

  const filteredTools = allTools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description?.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Table columns ────────────────────────────────────────
  const columns: TableColumn<Tool>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (_, row) => <span className="font-medium text-white">{row.name}</span>,
    },
    {
      key: 'description',
      label: 'Description',
      render: (value) => <span className="text-base-400">{value || '—'}</span>,
    },
    {
      key: 'category',
      label: 'Category',
      render: (_, row) => (
        <Badge variant={getCategoryVariant(row.category)}>
          {row.category || 'Other'}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'neutral'}>
          {row.status}
        </Badge>
      ),
    },
  ];

  // ─── Empty state ──────────────────────────────────────────
  if (filteredTools.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tools" description="Available tools for agents." />
        <div className="flex flex-wrap gap-4 items-center">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..."
            className="max-w-sm"
          />
          <div className="flex gap-2">
            {['all', 'ai', 'system', 'integration'].map((cat) => (
              <Button
                key={cat}
                variant={category === cat ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>
        </div>
        <EmptyState
          title="No tools match your filters"
          description="Try adjusting your search or category filter."
        />
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader title="Tools" description="Available tools for agents." />

      <div className="flex flex-wrap gap-4 items-center">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tools..."
          className="max-w-sm"
        />
        <div className="flex gap-2">
          {['all', 'ai', 'system', 'integration'].map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <Table columns={columns} data={filteredTools} />
      </div>
    </div>
  );
}