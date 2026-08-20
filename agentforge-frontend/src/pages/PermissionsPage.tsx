// src/pages/PermissionsPage.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionsApi } from '@/api/permissions';
import type { Permission } from '@/types/api';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Table, TableColumn } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

// ─── Skeleton loader ──────────────────────────────────────────
function PermissionsSkeleton() {
  return (
    <Card className="p-6 space-y-3">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </Card>
  );
}

// ─── Helper: ensure array from various API shapes ──────────
function ensureArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.results)) return obj.results as T[];
  }
  return [];
}

export function PermissionsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');

  const {
    data: permissions,
    isLoading,
    error,
    refetch,
  } = useQuery<Permission[]>({
    queryKey: ['permissions', role, search],
    queryFn: () =>
      permissionsApi.list({
        role: role === 'all' ? undefined : role,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, granted }: { id: string; granted: boolean }) =>
      permissionsApi.update(id, { granted }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
    },
  });

  if (isLoading) return <PermissionsSkeleton />;
  if (error) {
    return (
      <ErrorState
        title="Unable to load permissions"
        description={(error as Error).message || 'Permissions could not be retrieved.'}
        onRetry={refetch}
      />
    );
  }

  // ─── Safe array extraction ──────────────────────────────────
  const allPermissions = ensureArray<Permission>(permissions);
  const filtered = allPermissions.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.associated_agent?.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Table columns ──────────────────────────────────────────
  const columns: TableColumn<Permission>[] = [
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
      key: 'granted',
      label: 'Granted',
      render: (_, row) => (
        <Badge variant={row.granted ? 'success' : 'neutral'}>
          {row.granted ? 'Granted' : 'Denied'}
        </Badge>
      ),
    },
    {
      key: 'associated_agent',
      label: 'Associated Agent',
      render: (value) => <span>{value || '—'}</span>,
    },
    {
      key: 'id',
      label: 'Action',
      render: (_, row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            updateMutation.mutate({
              id: row.id,
              granted: !row.granted,
            })
          }
          disabled={updateMutation.isPending}
        >
          {row.granted ? 'Revoke' : 'Grant'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Permissions" description="Manage agent permissions." />

      <div className="flex flex-wrap gap-4 items-center">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search permissions..."
          className="max-w-sm"
        />
        <Select
          value={role}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRole(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
          <option value="viewer">Viewer</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No permissions match your filters"
          description="Try adjusting your search or filters."
        />
      ) : (
        <div className="card overflow-hidden">
          <Table columns={columns} data={filtered} />
        </div>
      )}
    </div>
  );
}