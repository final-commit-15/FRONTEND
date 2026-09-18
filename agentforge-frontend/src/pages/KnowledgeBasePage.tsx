import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Upload, FileText, FolderOpen, MoreVertical, Eye, Edit, Trash2, Download, Filter, X, Loader2, Globe, Image, Video, Music, Archive, ChevronDown } from 'lucide-react';
import { Suspense } from 'react';

import { apiClient } from '@/api/client';
import { projectsApi } from '@/api/projects';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Select } from '@/components/ui/Select';
import { Progress } from '@/components/ui/Progress';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Document {
  id: string;
  title: string;
  description?: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  file_url: string;
  thumbnail_url?: string;
  category: 'document' | 'image' | 'video' | 'audio' | 'archive' | 'other';
  tags: string[];
  uploaded_by: string;
  uploaded_by_name: string;
  workspace_id: string;
  project_id?: string | null;
  version?: number | null;
  created_at: string;
  updated_at: string;
}

interface DocumentListResponse {
  items: Document[];
  total: number;
  page: number;
  page_size: number;
}

const documentsApi = {
  list: async (params?: { search?: string; category?: string; tags?: string[]; skip?: number; limit?: number }): Promise<DocumentListResponse> => {
    const { data } = await apiClient.get<DocumentListResponse>('/knowledge-base', { params });
    return data;
  },
  get: async (id: string): Promise<Document> => {
    const { data } = await apiClient.get<Document>(`/knowledge-base/${id}`);
    return data;
  },
  upload: async (file: File, metadata: { title: string; description?: string; tags?: string[]; project_id?: string }): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', metadata.title);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.tags) formData.append('tags', JSON.stringify(metadata.tags));
    if (metadata.project_id) formData.append('project_id', metadata.project_id);
    const { data } = await apiClient.post<Document>('/knowledge-base/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },
  update: async (id: string, payload: Partial<Document>): Promise<Document> => {
    const { data } = await apiClient.patch<Document>(`/knowledge-base/${id}`, payload);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/knowledge-base/${id}`);
  },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  document: FileText,
  image: Image,
  video: Video,
  audio: Music,
  archive: Archive,
  other: FileText,
};

const CATEGORY_COLORS: Record<string, string> = {
  document: 'bg-blue-500/20 text-blue-400',
  image: 'bg-green-500/20 text-green-400',
  video: 'bg-purple-500/20 text-purple-400',
  audio: 'bg-pink-500/20 text-pink-400',
  archive: 'bg-amber-500/20 text-amber-400',
  other: 'bg-gray-500/20 text-gray-400',
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getCategoryFromMimeType(mimeType: string): Document['category'] {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gz') || mimeType.includes('rar')) return 'archive';
  return 'other';
}

function DocumentCard({ document, onDelete }: { document: Document; onDelete: (id: string) => void }) {
  const CategoryIcon = CATEGORY_ICONS[document.category] || FileText;
  const categoryColor = CATEGORY_COLORS[document.category] || 'bg-gray-500/20 text-gray-400';

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="p-4 flex-1">
        <div className="flex items-start justify-between mb-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `var(--${categoryColor.replace('bg-', '').replace('/20 text-', '-text-')})` }}>
            <CategoryIcon className="h-5 w-5" style={{ color: `var(--${categoryColor.replace('bg-', '').replace('/20 text-', '-text-')})` }} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.open(document.file_url, '_blank')}>
                <Eye className="h-4 w-4 mr-2" /> View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(document.file_url, '_blank')}>
                <Download className="h-4 w-4 mr-2" /> Download
              </DropdownMenuItem>
              <DropdownMenuItem className="text-error-600" onClick={() => onDelete(document.id)}>
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <h3 className="font-semibold text-text-heading truncate mb-1">{document.title}</h3>
        {document.description && (
          <p className="text-text-body text-sm mb-3 line-clamp-2">{document.description}</p>
        )}
        <div className="flex items-center justify-between">
          <Badge className={categoryColor} variant="default">{document.category}</Badge>
          <span className="text-xs text-text-muted">{formatFileSize(document.file_size)}</span>
        </div>
        {document.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {document.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="default" className="text-xs">{tag}</Badge>
            ))}
            {document.tags.length > 3 && (
              <Badge variant="default" className="text-xs">+{document.tags.length - 3} more</Badge>
            )}
          </div>
        )}
      </div>
      <div className="px-4 py-2 border-t border-canvas-border flex items-center justify-between text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <Upload className="h-3 w-3" />
          {document.uploaded_by_name}
        </span>
        <span>{formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}</span>
      </div>
    </Card>
  );
}

function UploadDialog({ onClose }: { onClose: () => void }) {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string>('');
  const [projectId, setProjectId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { data: kbProjects } = useQuery({
    queryKey: ['projects', 'kb-list'],
    queryFn: () => projectsApi.list(),
    retry: false,
  });
  const projectOptions: any[] = Array.isArray(kbProjects) ? kbProjects : [];

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      if (description) formData.append('description', description);
      if (tags) formData.append('tags', JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)));
      if (projectId) formData.append('project_id', projectId);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/knowledge-base/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
      addToast({ type: 'success', title: 'Upload complete', description: `${file.name} has been uploaded.` });
      onClose();
    } catch (error) {
      addToast({ type: 'error', title: 'Upload failed', description: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogDescription>Add a new document to your knowledge base.</DialogDescription>
      </DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); handleUpload(); }} className="space-y-4">
        <div className="space-y-2">
          <label className="label">File</label>
          <div className="border-2 border-dashed border-canvas-border rounded-xl p-6 text-center hover:border-brand-primary/50 transition-colors">
            <input
              type="file"
              onChange={(e) => e.target.files && setFile(e.target.files[0])}
              className="hidden"
              id="file-upload"
              accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.gif,.webp,.mp4,.mov,.mp3,.wav,.zip,.tar,.gz"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-10 w-10 mx-auto text-text-muted mb-3" />
              <p className="text-text-body">Drag & drop or click to upload</p>
              <p className="text-text-muted text-sm">PDF, DOC, TXT, Images, Videos, Audio, Archives</p>
            </label>
            {file && (
              <div className="mt-3 p-3 bg-canvas-surface rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-brand-primary" />
                  <div>
                    <p className="font-medium text-text-heading">{file.name}</p>
                    <p className="text-sm text-text-muted">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <label className="label">Title</label>
          <Input placeholder="Document title" value={title} onChange={(e) => setTitle(e.target.value)} defaultValue={file?.name} required />
        </div>
        <div className="space-y-2">
          <label className="label">Description (optional)</label>
          <Input placeholder="Brief description..." value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="label">Project (optional — links doc to a project; requirement updates go here)</label>
          <Select value={projectId} onChange={(v) => setProjectId(v as string)}>
            <option value="">No project</option>
            {projectOptions.map((p: any) => (
              <option key={String(p.id)} value={String(p.id)}>{String(p.name)}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label className="label">Tags (comma separated)</label>
          <Input placeholder="tag1, tag2, tag3" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}
      </form>
      <DialogFooter className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={uploading}>Cancel</Button>
        <Button type="submit" disabled={uploading || !file}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function KnowledgeBasePage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | Document['category']>('all');
  const [projectFilter, setProjectFilter] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const { data: kbProjectList } = useQuery({
    queryKey: ['projects', 'kb-filter'],
    queryFn: () => projectsApi.list(),
    retry: false,
  });
  const kbProjects: any[] = Array.isArray(kbProjectList) ? kbProjectList : [];

  const { data, isLoading, refetch } = useQuery<DocumentListResponse>({
    queryKey: ['knowledge-base', { search, categoryFilter }],
    queryFn: () => documentsApi.list({ search: search || undefined, category: categoryFilter === 'all' ? undefined : categoryFilter }),
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
      addToast({ type: 'success', title: 'Document deleted', description: 'Document has been removed.' });
    },
    onError: (error: any) => {
      addToast({ type: 'error', title: 'Failed to delete', description: error.message });
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

  const documents = data?.items ?? [];

  const filteredDocuments = documents.filter(d =>
    (!projectFilter || String((d as any).project_id ?? '') === projectFilter) &&
    (d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.description?.toLowerCase().includes(search.toLowerCase()) ||
    d.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-heading">Knowledge Base</h1>
          <p className="text-text-body mt-1">Every project appears here. Store PDFs/docs per project and upload client requirement updates.</p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)} icon={<Upload size={18} />}>
          Upload Document
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Input placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={projectFilter} onChange={(v) => setProjectFilter(v as string)}>
            <option value="">All projects</option>
            {kbProjects.map((p: any) => (
              <option key={String(p.id)} value={String(p.id)}>{String(p.name)}</option>
            ))}
          </Select>
          <Select value={categoryFilter} onChange={(v) => setCategoryFilter(v as any)}>
            <option value="all">All Types</option>
            <option value="document">Documents</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="archive">Archives</option>
            <option value="other">Other</option>
          </Select>
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <EmptyState
          title={search ? 'No matching documents' : 'No documents yet'}
          description={search ? 'Try adjusting your search' : 'Upload your first document to get started'}
          action={<Button onClick={() => setShowUploadDialog(true)} icon={<Upload size={18} />}>Upload Document</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDocuments.map(document => (
            <DocumentCard key={document.id} document={document} onDelete={deleteMutation.mutate} />
          ))}
        </div>
      )}

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <UploadDialog onClose={() => setShowUploadDialog(false)} />
      </Dialog>
    </div>
  );
}