import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, FolderKanban, MoreVertical, Trash2, Eye, Users, ListChecks, CalendarDays, Mail, Loader2, Play, CheckCircle2, Archive } from 'lucide-react';

import { projectsApi } from '@/api/projects';
import { getApiErrorMessage } from '@/api/client';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  client_name: string;
  organization_name?: string;
  client_email?: string;
  deadline?: string;
  description?: string;
  status: 'active' | 'archived' | 'completed' | 'upcoming';
  workspace_id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/20',
  upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
  completed: 'bg-gray-500/20 text-gray-400 border-gray-500/20',
  archived: 'bg-gray-500/20 text-gray-400 border-gray-500/20',
};

function ProjectCard({ project, onDelete, onSetActive, onSetCompleted }: {
  project: Project;
  onDelete: (id: string) => void;
  onSetActive: (id: string) => void;
  onSetCompleted: (id: string) => void;
}) {
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
              <p className="text-sm text-text-muted">{project.client_name || 'No client'}</p>
            </div>
          </div>
          <Badge className={statusColor}>{project.status}</Badge>
        </div>
        {project.organization_name && (
          <p className="text-sm text-text-muted mb-2">{project.organization_name}</p>
        )}
        {project.description && (
          <p className="text-text-body text-sm mb-4 line-clamp-2">{project.description}</p>
        )}
        <div className="flex flex-wrap gap-4 text-xs text-text-muted">
          {project.deadline && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {format(new Date(project.deadline), 'MMM d, yyyy')}
            </span>
          )}
          {project.client_email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {project.client_email}
            </span>
          )}
        </div>
      </div>
      <div className="px-4 py-3 border-t border-canvas-border flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => window.location.href = `/projects/${project.id}`}>
            <Eye className="h-3.5 w-3.5" />
            <span>Open</span>
          </Button>
        </div>
        <div className="flex gap-1">
          {project.status === 'upcoming' && (
            <Button variant="primary" size="sm" className="gap-1" onClick={() => onSetActive(project.id)}>
              <Play className="h-3.5 w-3.5" />
              <span>Set Active</span>
            </Button>
          )}
          {project.status === 'active' && (
            <Button variant="outline" size="sm" className="gap-1" onClick={() => onSetCompleted(project.id)}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Complete</span>
            </Button>
          )}
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
              {project.status === 'upcoming' && (
                <DropdownMenuItem onClick={() => onSetActive(project.id)}>
                  <Play className="h-4 w-4 mr-2" /> Set Active
                </DropdownMenuItem>
              )}
              {project.status === 'active' && (
                <DropdownMenuItem onClick={() => onSetCompleted(project.id)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Completed
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-error-600" onClick={() => onDelete(project.id)}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}

function ProjectsPageContent() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user, workspace } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived' | 'completed' | 'upcoming'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    client_name: '',
    organization_name: '',
    client_email: '',
    deadline: '',
    description: '',
  });
  const activeWorkspaceId =
    (user as { active_workspace_id?: string } | null)?.active_workspace_id ??
    (workspace as { id?: string } | null)?.id;

  const { data, isLoading, refetch } = useQuery<Project[]>({
    queryKey: ['projects', { search, statusFilter }],
    queryFn: () => projectsApi.list(),
    retry: false,
  });

  const emptyCreateForm = {
    name: '',
    client_name: '',
    organization_name: '',
    client_email: '',
    deadline: '',
    description: '',
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.name.trim() || !createFormData.client_name.trim()) {
      addToast({ type: 'error', title: 'Missing fields', description: 'Project name and client name are required.' });
      return;
    }
    if (!createFormData.deadline) {
      addToast({ type: 'error', title: 'Deadline required', description: 'Pick a project deadline to continue.' });
      return;
    }
    createMutation.mutate(createFormData);
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => projectsApi.create({ ...payload, status: 'upcoming' }),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      addToast({ type: 'success', title: 'Project created', description: `${project.name} has been created with upcoming status.` });
      setShowCreateDialog(false);
      setCreateFormData({ ...emptyCreateForm });
    },
    onError: (error: any) => {
      const msg = getApiErrorMessage(error);
      console.error('[Projects] Create failed:', error?.response?.data ?? error);
      addToast({ type: 'error', title: 'Failed to create project', description: msg });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      addToast({ type: 'success', title: 'Project deleted', description: 'Project has been deleted.' });
    },
    onError: (error: any) => {
      const msg = getApiErrorMessage(error);
      console.error('[Projects] Delete failed:', error?.response?.data ?? error);
      addToast({ type: 'error', title: 'Failed to delete project', description: msg });
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: (id: string) => projectsApi.update(id, { status: 'active' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      addToast({ type: 'success', title: 'Project activated', description: 'Project is now active and will appear in AI Project Intake.' });
    },
    onError: (error: any) => {
      const msg = getApiErrorMessage(error);
      console.error('[Projects] Activate failed:', error?.response?.data ?? error);
      addToast({ type: 'error', title: 'Failed to activate project', description: msg });
    },
  });

  const setCompletedMutation = useMutation({
    mutationFn: (id: string) => projectsApi.update(id, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      addToast({ type: 'success', title: 'Project completed', description: 'Project marked as completed.' });
    },
    onError: (error: any) => {
      const msg = getApiErrorMessage(error);
      console.error('[Projects] Complete failed:', error?.response?.data ?? error);
      addToast({ type: 'error', title: 'Failed to complete project', description: msg });
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

  // Backend returns a plain array
  const projects: Project[] = Array.isArray(data) ? data : [];

  const filteredProjects = projects.filter(p =>
    (p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()) ||
    p.client_name?.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === 'all' || p.status === statusFilter)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-heading">Projects</h1>
          <p className="text-text-body mt-1">Manage your projects. Create as upcoming, then set active when ready for AI intake.</p>
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
          {(['all', 'upcoming', 'active', 'completed', 'archived'] as const).map(status => (
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
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={deleteMutation.mutate}
              onSetActive={setActiveMutation.mutate}
              onSetCompleted={setCompletedMutation.mutate}
            />
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Start a new project. It will be created with "Upcoming" status — set it to Active when ready for AI intake.</DialogDescription>
          </DialogHeader>
          <form id="create-project-form" onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <label className="label">Project Name *</label>
              <Input placeholder="Smart Attendance System" value={createFormData.name} onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="label">Client Name *</label>
              <Input placeholder="ABC College" value={createFormData.client_name} onChange={(e) => setCreateFormData({...createFormData, client_name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="label">Organization Name (optional)</label>
              <Input placeholder="ABC College Hyderabad" value={createFormData.organization_name} onChange={(e) => setCreateFormData({...createFormData, organization_name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="label">Client Email (optional)</label>
              <Input type="email" placeholder="client@abccollege.edu" value={createFormData.client_email} onChange={(e) => setCreateFormData({...createFormData, client_email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="label">Deadline *</label>
              <Input type="date" value={createFormData.deadline} onChange={(e) => setCreateFormData({...createFormData, deadline: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="label">Description (optional)</label>
              <Textarea placeholder="AI-powered attendance and monitoring system..." value={createFormData.description} onChange={(e) => setCreateFormData({...createFormData, description: e.target.value})} rows={3} />
            </div>
          </form>
          <DialogFooter className="flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button type="submit" form="create-project-form" disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ProjectsPage() {
  return <ProjectsPageContent />;
}
