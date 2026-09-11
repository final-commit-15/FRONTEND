import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, ChevronDown, MoreHorizontal, ExternalLink, ArrowRight, Star, Zap, Brain, Target, Flag, CheckCircle2, Clock, AlertTriangle, Loader2, Trash2 } from 'lucide-react';

import { requirementsApi } from '@/api/requirements';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-500/20 text-gray-400',
  medium: 'bg-blue-500/20 text-blue-400',
  high: 'bg-orange-500/20 text-orange-400',
  critical: 'bg-red-500/20 text-red-400',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  planned: 'bg-blue-500/20 text-blue-400',
  in_progress: 'bg-yellow-500/20 text-yellow-400',
  in_review: 'bg-purple-500/20 text-purple-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  archived: 'bg-gray-500/20 text-gray-400',
};

function FeatureCard({ 
  feature, 
  onUpdate, 
  onDelete,
  deleteMutation,
  navigate
}: { 
  feature: any; 
  onUpdate: (data: any) => void; 
  onDelete: (id: string) => void;
  deleteMutation: any;
  navigate: any;
}) {
  const statusColor = STATUS_COLORS[feature.status] || 'bg-gray-500/20 text-gray-400';
  const priorityColor = PRIORITY_COLORS[feature.priority] || 'bg-gray-500/20 text-gray-400';

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
              <Zap className="h-5 w-5 text-brand-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-text-heading truncate">{feature.title}</h3>
                <span className="text-xs text-text-muted font-mono">{feature.feature_key}</span>
              </div>
              <p className="text-sm text-text-muted truncate">{feature.description || 'No description'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-canvas-border">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={priorityColor}>{feature.priority}</Badge>
            <Badge className={STATUS_COLORS[feature.status] || 'bg-gray-500/20 text-gray-400'}>{feature.status.replace('_', ' ')}</Badge>
            {feature.epic && <Badge variant="default" className="text-xs">{feature.epic}</Badge>}
          </div>
          {feature.estimated_story_points && (
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Target className="h-3 w-3" /> {feature.estimated_story_points} SP
            </span>
          )}
        </div>

        {feature.acceptance_criteria?.length > 0 && (
          <div className="bg-canvas-surface rounded-lg p-3">
            <p className="text-xs font-medium text-text-muted">Acceptance Criteria:</p>
            <ul className="space-y-1">
              {feature.acceptance_criteria.slice(0, 3).map((c: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm text-text-body">
                  <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                  <span className="truncate">{c}</span>
                </li>
              ))}
              {feature.acceptance_criteria.length > 3 && (
                <p className="text-xs text-text-muted">+{feature.acceptance_criteria.length - 3} more criteria</p>
              )}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-canvas-border">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            {feature.assignee && (
              <span className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary text-xs font-medium">
                  {feature.assignee?.full_name?.[0] || 'U'}
                </div>
                <span className="truncate max-w-[100px]">{feature.assignee?.full_name || feature.assignee?.email}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            {feature.estimated_story_points && (
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" /> {feature.estimated_story_points} SP
              </span>
            )}
            <span className="font-mono text-text-muted">{feature.feature_key}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function FeaturesPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('-created_at');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingFeature, setEditingFeature] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    epic: '',
    user_story: '',
    acceptance_criteria: [],
    technical_notes: '',
    priority: 'medium',
    estimated_story_points: undefined,
    assignee_id: undefined,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['features', { search, statusFilter, priorityFilter, sortBy }],
    queryFn: () => requirementsApi.listFeatures({ search, status: statusFilter === 'all' ? undefined : statusFilter, priority: priorityFilter === 'all' ? undefined : priorityFilter, sort: sortBy }),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => requirementsApi.createFeature(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      addToast({ type: 'success', title: 'Feature created', description: 'Feature created successfully.' });
      setShowCreateDialog(false);
      setFormData({ title: '', description: '', epic: '', user_story: '', acceptance_criteria: [], technical_notes: '', priority: 'medium', estimated_story_points: undefined, assignee_id: undefined });
    },
    onError: (error: any) => {
      addToast({ type: 'error', title: 'Failed to create feature', description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => requirementsApi.updateFeature(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      addToast({ type: 'success', title: 'Feature updated', description: 'Feature updated successfully.' });
      setShowCreateDialog(false);
    },
    onError: (error: any) => {
      addToast({ type: 'error', title: 'Failed to update feature', description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => requirementsApi.deleteFeature(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      addToast({ type: 'success', title: 'Deleted', description: 'Feature deleted.' });
    },
    onError: (error: any) => {
      addToast({ type: 'error', title: 'Delete failed', description: error.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFeature) {
      updateMutation.mutate({ id: editingFeature.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredFeatures = data?.items.filter(f => 
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    f.description?.toLowerCase().includes(search.toLowerCase())
  ) || [];

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

  if (error) {
    return (
      <EmptyState
        title="Failed to load features"
        description={error instanceof Error ? error.message : 'Unknown error'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-heading">Features</h1>
          <p className="text-text-body mt-1">Manage product features, epics, and user stories.</p>
        </div>
        <Button onClick={() => { setEditingFeature(null); setFormData({ title: '', description: '', epic: '', user_story: '', acceptance_criteria: [], technical_notes: '', priority: 'medium', estimated_story_points: undefined, assignee_id: undefined }); setShowCreateDialog(true); }} icon={<Plus size={18} />}>
          New Feature
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search features..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
        </div>
        <Select value={statusFilter} onChange={setStatusFilter}>
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="planned">Planned</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </Select>
        <Select value={priorityFilter} onChange={setPriorityFilter}>
          <option value="all">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </Select>
      </div>

      {filteredFeatures.length === 0 ? (
        <EmptyState
          title={search ? 'No matching features' : 'No features yet'}
          description={search ? 'Try adjusting your search or filters' : 'Create your first feature to get started'}
          action={
            <Button onClick={() => { setEditingFeature(null); setFormData({ title: '', description: '', epic: '', user_story: '', acceptance_criteria: [], technical_notes: '', priority: 'medium', estimated_story_points: undefined, assignee_id: undefined }); setShowCreateDialog(true); }} icon={<Plus size={18} />}>
              Create Feature
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredFeatures.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              onUpdate={(data) => updateMutation.mutate({ id: feature.id, data })}
              onDelete={deleteMutation.mutate}
              deleteMutation={deleteMutation}
              navigate={navigate}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFeature ? 'Edit Feature' : 'Create Feature'}</DialogTitle>
            <DialogDescription>Define a new product feature with acceptance criteria and technical details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="label">Title</label>
              <Input placeholder="Feature title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="label">Description</label>
              <Textarea placeholder="Feature description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label">Epic</label>
                <Input placeholder="Epic name" value={formData.epic} onChange={(e) => setFormData({...formData, epic: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="label">Feature Key</label>
                <Input placeholder="FEAT-123" value={formData.feature_key} onChange={(e) => setFormData({...formData, feature_key: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="label">User Story</label>
              <Textarea placeholder="As a [user], I want to [action], so that [benefit]" value={formData.user_story} onChange={(e) => setFormData({...formData, user_story: e.target.value})} rows={2} />
            </div>
            <div className="space-y-2">
              <label className="label">Acceptance Criteria (one per line)</label>
              <Textarea placeholder="Criterion 1\nCriterion 2\nCriterion 3" value={formData.acceptance_criteria?.join('\n') || ''} onChange={(e) => setFormData({...formData, acceptance_criteria: e.target.value.split('\n').filter(c => c.trim())})} rows={4} />
            </div>
            <div className="space-y-2">
              <label className="label">Technical Notes</label>
              <Textarea placeholder="Technical implementation details..." value={formData.technical_notes} onChange={(e) => setFormData({...formData, technical_notes: e.target.value})} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label">Priority</label>
                <Select value={formData.priority} onChange={(v) => setFormData({...formData, priority: v as any})}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="label">Estimated Story Points</label>
                <Input type="number" value={formData.estimated_story_points || ''} onChange={(e) => setFormData({...formData, estimated_story_points: parseInt(e.target.value) || undefined})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="label">Assignee</label>
              <Select value={formData.assignee_id || ''} onChange={(v) => setFormData({...formData, assignee_id: v || undefined})}>
                <option value="">Unassigned</option>
              </Select>
            </div>
          </form>
          <DialogFooter className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                editingFeature ? 'Save Changes' : 'Create Feature'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}