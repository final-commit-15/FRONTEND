import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, FolderKanban, Archive, MoreVertical, Edit, Trash2, Eye, Settings, Users, Zap, ListChecks, CalendarDays, BookOpen, GitBranch, ArrowRight } from 'lucide-react';
import { Suspense } from 'react';

import { apiClient } from '@/api/client';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'archived' | 'completed';
  workspace_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  task_count?: number;
}

interface ProjectListResponse {
  items: Project[];
  total: number;
  page: number;
  page_size: number;
}

const projectsApi = {
  list: async (params?: { search?: string; status?: string; skip?: number; limit?: number }): Promise<ProjectListResponse> => {
    const { data } = await apiClient.get<ProjectListResponse>('/projects', { params });
    return data;
  },
  get: async (id: string): Promise<Project> => {
    const { data } = await apiClient.get<Project>(`/projects/${id}`);
    return data;
  },
  create: async (payload: { name: string; description?: string }): Promise<Project> => {
    const { data } = await apiClient.post<Project>('/projects', payload);
    return data;
  },
  update: async (id: string, payload: Partial<Project>): Promise<Project> => {
    const { data } = await apiClient.patch<Project>(`/projects/${id}`, payload);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  archived: 'bg-gray-500/20 text-gray-400',
  completed: 'bg-blue-500/20 text-blue-400',
};

function ProjectCard({ project, onDelete }: { project: Project; onDelete: (id: string) => void }) {
  const statusColor = STATUS_COLORS[project.status] || 'bg-gray-500/20 text-gray-400';

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
              <FolderKanban className="h-5 w-5 text-brand-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-text-heading truncate">{project.name}</h3>
              <p className="text-sm text-text-muted">{project.member_count || 0} members</p>
            </div>
          </div>
          <Badge className={statusColor}>{project.status}</Badge>
        </div>
        {project.description && (
          <p className="text-text-body text-sm mb-4 line-clamp-2">{project.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <ListChecks className="h-3 w-3" />
            {project.task_count || 0} tasks
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {project.member_count || 0} members
          </span>
        </div>
      </div>
      <div className="px-4 py-3 border-t border-canvas-border flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => window.location.href = `/projects/${project.id}`}>
            <Eye className="h-3.5 w-3.5" />
            <span>Open</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => window.location.href = `/projects/${project.id}/settings`}>
            <Settings className="h-3.5 w-3.5" />
            <span>Settings</span>
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => window.location.href = `/projects/${project.id}`}>
              <Eye className="h-4 w-4 mr-2" /> View Project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = `/projects/${project.id}/settings`}>
              <Settings className="h-4 w-4 mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="text-error-600" onClick={() => onDelete(project.id)}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}

function ProjectsPageContent() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived' | 'completed'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createFormData, setCreateFormData] = useState({ name: '', description: '' });

  const { data, isLoading, refetch } = useQuery<ProjectListResponse>({
    queryKey: ['projects', { search, statusFilter }],
    queryFn: () => projectsApi.list({ search: search || undefined, status: statusFilter === 'all' ? undefined : statusFilter }),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string }) => projectsApi.create(payload),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      addToast({ type: 'success', title: 'Project created', description: `${project.name} has been created.` });
      setShowCreateDialog(false);
      setCreateFormData({ name: '', description: '' });
      navigate(`/projects/${project.id}`);
    },
    onError: (error: any) => {
      addToast({ type: 'error', title: 'Failed to create project', description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      addToast({ type: 'success', title: 'Project deleted', description: 'Project has been deleted.' });
    },
    onError: (error: any) => {
      addToast({ type: 'error', title: 'Failed to delete project', description: error.message });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton variant="title" className="w-56" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const projects = data?.items ?? [];

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-heading">Projects</h1>
          <p className="text-text-body mt-1">Manage your projects and workspaces.</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} icon={<Plus size={18} />}>
          New Project
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'archived', 'completed'] as const).map(status => (
            <Button
              key={status}
              variant={statusFilter === status ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <EmptyState
          title={search ? 'No matching projects' : 'No projects yet'}
          description={search ? 'Try adjusting your search' : 'Create your first project to get started'}
          action={<Button onClick={() => setShowCreateDialog(true)} icon={<Plus size={18} />}>Create Project</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map(project => (
            <ProjectCard key={project.id} project={project} onDelete={deleteMutation.mutate} />
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Start a new project for your team.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(createFormData); }} className="space-y-4">
            <div className="space-y-2">
              <label className="label">Project Name</label>
              <Input placeholder="My Awesome Project" value={createFormData.name} onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="label">Description (optional)</label>
              <Input placeholder="Project description..." value={createFormData.description} onChange={(e) => setCreateFormData({...createFormData, description: e.target.value})} />
            </div>
          </form>
          <DialogFooter className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { Loader2 } from 'lucide-react';

export function ProjectsPage() {
  return <ProjectsPageContent />;
}