// src/pages/ToolsPage.tsx

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toolsApi } from '@/api/tools';
import type { Tool } from '@/types/api';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Table, TableColumn } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

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

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <Skeleton variant="title" className="w-56" />
        <Card>
          <CardContent className="pt-0">
            <Skeleton variant="card" className="h-60" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load tools"
        description={(error as Error).message || 'Tools could not be retrieved.'}
        onRetry={refetch}
      />
    );
  }

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

  const columns: TableColumn<Tool>[] = [
    {
      key: 'name',
      label: 'Name',
      render: (_, row) => <span className="font-medium text-text-heading">{row.name}</span>,
    },
    {
      key: 'description',
      label: 'Description',
      render: (value) => <span className="text-text-muted">{value || '—'}</span>,
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

  return (
    <div className="space-y-6 animate-fade-in">
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

      {filteredTools.length === 0 ? (
        <EmptyState
          title="No tools match your filters"
          description="Try adjusting your search or category filter."
        />
      ) : (
        <Card className="overflow-hidden">
          <Table columns={columns} data={filteredTools} striped hoverable />
        </Card>
      )}
    </div>
  );
}