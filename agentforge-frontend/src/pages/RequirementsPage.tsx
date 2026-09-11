// src/pages/RequirementsPage.tsx

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Plus, Upload, FileText, FileCode, Globe, PenTool, GitBranch, Image, Loader2, X, ChevronDown, MoreHorizontal, Eye, Download, Trash2, Sparkles, Search } from 'lucide-react';

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

const SOURCE_ICONS: Record<string, React.ElementType> = {
  pdf: FileText,
  docx: FileText,
  txt: FileText,
  markdown: FileText,
  figma_url: PenTool,
  website_url: Globe,
  github_repo_url: GitBranch,
  screenshot: Image,
};

const SOURCE_LABELS: Record<string, string> = {
  pdf: 'PDF',
  docx: 'DOCX',
  txt: 'TXT',
  markdown: 'Markdown',
  figma_url: 'Figma',
  website_url: 'Website',
  github_repo_url: 'GitHub',
  screenshot: 'Screenshot',
};

const STATUS_COLORS: Record<string, string> = {
  uploaded: 'bg-blue-500/20 text-blue-400',
  processing: 'bg-yellow-500/20 text-yellow-400',
  processed: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
  archived: 'bg-gray-500/20 text-gray-400',
};

function RequirementCard({ 
  requirement, 
  onProcess, 
  onDelete,
  navigate
}: { 
  requirement: any; 
  onProcess: (id: string) => void; 
  onDelete: (id: string) => void;
  navigate: any;
}) {
  const SourceIcon = SOURCE_ICONS[requirement.source] || FileText;
  const statusColor = STATUS_COLORS[requirement.status] || 'bg-gray-500/20 text-gray-400';

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
              <SourceIcon className="h-6 w-6 text-brand-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-text-heading truncate">{requirement.title}</h3>
              <p className="text-sm text-text-muted truncate">{requirement.description || 'No description'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-canvas-border">
          <div className="flex items-center gap-2">
            <SourceIcon className="h-4 w-4 text-text-muted" />
            <span className="text-sm text-text-muted">{SOURCE_LABELS[requirement.source] || requirement.source}</span>
          </div>
          <Badge className={statusColor}>{requirement.status}</Badge>
        </div>

        {requirement.ai_summary && (
          <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-lg p-3">
            <p className="text-sm text-text-heading">{requirement.ai_summary}</p>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>{format(new Date(requirement.created_at), 'MMM d, yyyy')}</span>
          {requirement.ai_extracted_features?.length > 0 && (
            <span className="text-brand-primary">{requirement.ai_extracted_features.length} features extracted</span>
          )}
        </div>
      </div>
    </Card>
  );
}

export function RequirementsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSource, setUploadSource] = useState<string>('pdf');
  const [uploadSourceUrl, setUploadSourceUrl] = useState<string>('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['requirements', { search, statusFilter }],
    queryFn: () => requirementsApi.list({ search, status: statusFilter === 'all' ? undefined : statusFilter }),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: (payload: { title: string; description?: string; source: string; source_url?: string; file?: File }) => {
      if (payload.file) {
        const formData = new FormData();
        formData.append('file', payload.file);
        formData.append('source', payload.source);
        return requirementsApi.uploadFile('temp', payload.file, payload.source);
      }
      return requirementsApi.create(payload as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
      addToast({ type: 'success', title: 'Requirement created', description: 'Requirement uploaded successfully.' });
      setShowCreateDialog(false);
      setUploadFile(null);
    },
    onError: (error: any) => {
      addToast({ type: 'error', title: 'Failed to create requirement', description: error.message });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: ({ requirementId, file, source }: { requirementId: string; file: File; source: string }) =>
      requirementsApi.uploadFile(requirementId, file, uploadSource),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
      addToast({ type: 'success', title: 'File uploaded', description: 'Requirement file uploaded successfully.' });
      setUploadFile(null);
      setShowCreateDialog(false);
    },
    onError: (error: any) => {
      addToast({ type: 'error', title: 'Upload failed', description: error.message });
    },
  });

  const processMutation = useMutation({
    mutationFn: (id: string) => requirementsApi.process(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
      addToast({ type: 'success', title: 'Processing started', description: 'AI is extracting features from the requirement.' });
    },
    onError: (error: any) => {
      addToast({ type: 'error', title: 'Processing failed', description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => requirementsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
      addToast({ type: 'success', title: 'Deleted', description: 'Requirement deleted.' });
    },
    onError: (error: any) => {
      addToast({ type: 'error', title: 'Delete failed', description: error.message });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadFile(acceptedFiles[0]);
      setShowCreateDialog(true);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'text/markdown': ['.md', '.markdown'],
    'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
  }});

  const filteredRequirements = data?.items.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase())
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
        title="Failed to load requirements"
        description={error instanceof Error ? error.message : 'Unknown error'}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-heading">Requirements</h1>
          <p className="text-text-body mt-1">Upload and manage project requirements for AI processing.</p>
        </div>
        <Button onClick={() => { setUploadSource('pdf'); setShowCreateDialog(true); }} icon={<Plus size={18} />}>
          Upload Requirement
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search requirements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
        </div>
        <Select value={statusFilter} onChange={setStatusFilter}>
          <option value="all">All Statuses</option>
          <option value="uploaded">Uploaded</option>
          <option value="processing">Processing</option>
          <option value="processed">Processed</option>
          <option value="failed">Failed</option>
          <option value="archived">Archived</option>
        </Select>
      </div>

      <div {...getRootProps()} className={cn(
        'border-2 border-dashed rounded-2xl p-8 transition-colors',
        isDragActive ? 'border-brand-primary bg-brand-primary/5' : 'border-canvas-border hover:border-brand-primary/50'
      )}>
        <input {...getInputProps()} />
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-text-muted mb-4" />
          <p className="text-text-heading mb-1">
            {isDragActive ? 'Drop files here' : 'Drag & drop requirement files here'}
          </p>
          <p className="text-text-muted text-sm">PDF, DOCX, TXT, Markdown, Figma, URLs, images</p>
        </div>
      </div>

      {filteredRequirements.length === 0 ? (
        <EmptyState
          title={search ? 'No matching requirements' : 'No requirements yet'}
          description={search ? 'Try adjusting your search or filters' : 'Upload your first requirement to get started'}
          action={
            <Button onClick={() => { setUploadSource('pdf'); setShowCreateDialog(true); }} icon={<Plus size={18} />}>
              Upload Requirement
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRequirements.map((req) => (
            <RequirementCard
              key={req.id}
              requirement={req}
              onProcess={processMutation.mutate}
              onDelete={deleteMutation.mutate}
              navigate={navigate}
            />
          ))}
        </div>
      )}

      {/* Create/Upload Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Requirement</DialogTitle>
            <DialogDescription>Upload a requirement document or provide a URL for AI processing.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="label">Source Type</label>
                <Select value={uploadSource} onChange={setUploadSource}>
                  <option value="pdf">PDF File</option>
                  <option value="docx">DOCX File</option>
                  <option value="txt">Text File</option>
                  <option value="markdown">Markdown File</option>
                  <option value="figma_url">Figma URL</option>
                  <option value="website_url">Website URL</option>
                  <option value="github_repo_url">GitHub Repository URL</option>
                  <option value="screenshot">Screenshot/Image</option>
                </Select>
              </div>

              {['pdf', 'docx', 'txt', 'markdown', 'screenshot'].includes(uploadSource) && (
                <div className={cn(
                  'border-2 border-dashed rounded-xl p-6 transition-colors',
                  isDragActive ? 'border-brand-primary bg-brand-primary/5' : 'border-canvas-border',
                  getRootProps().className
                )} {...getRootProps()}>
                  <input {...getInputProps()} />
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-text-muted mb-4" />
                    <p className="text-text-heading mb-1">
                      {isDragActive ? 'Drop file here' : 'Drag & drop file here'}
                    </p>
                    <p className="text-text-muted text-sm">PDF, DOCX, TXT, Markdown, images</p>
                  </div>
                </div>
              )}

              {['figma_url', 'website_url', 'github_repo_url'].includes(uploadSource) && (
                <div className="space-y-2">
                  <label className="label">URL</label>
                  <Input
                    placeholder={`Enter ${SOURCE_LABELS[uploadSource]} URL`}
                    onChange={(e) => setUploadSourceUrl(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                if (uploadFile) {
                  uploadMutation.mutate({ requirementId: 'temp', file: uploadFile, source: uploadSource });
                }
              }}
              disabled={(!uploadFile && !['figma_url', 'website_url', 'github_repo_url'].includes(uploadSource)) || createMutation.isPending || uploadMutation.isPending}
            >
              {createMutation.isPending || uploadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Upload & Process'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}