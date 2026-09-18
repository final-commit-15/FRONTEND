// src/components/dashboard/ArtifactsSection.tsx
// Artifacts Section - displays generated artifacts with download capabilities

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Download, Loader2, AlertCircle, ChevronRight, CheckCircle2, X, Clock, FileText } from 'lucide-react';
import { aiProvidersApi } from '@/api/aiProviders';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { apiClient } from '@/api/client';
import { useToast } from '@/hooks/useToast';

interface Artifact {
  name: string;
  path: string;
  size: number;
  modified: string;
  extension: string;
}

interface ArtifactsResponse {
  pipeline_id: string;
  artifacts: Artifact[];
}

interface GenerateArtifactsResponse {
  pipeline_id: string;
  artifacts: Record<string, any>;
  generated_at: string;
}

const EXTENSION_ICONS: Record<string, React.ReactNode> = {
  '.pdf': <FileText className="text-red-500" size={20} />,
  '.docx': <FileText className="text-blue-500" size={20} />,
  '.csv': <FileText className="text-green-500" size={20} />,
  '.json': <FileText className="text-yellow-500" size={20} />,
};

const EXTENSION_LABELS: Record<string, string> = {
  '.pdf': 'PDF Document',
  '.docx': 'Word Document',
  '.csv': 'CSV Spreadsheet',
  '.json': 'JSON Data',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Unknown date';
  }
}

interface ArtifactsSectionProps {
  pipelineId: string;
  onGenerate?: () => void;
}

export function ArtifactsSection({ pipelineId, onGenerate }: ArtifactsSectionProps) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['artifacts', pipelineId],
    queryFn: async (): Promise<ArtifactsResponse> => {
      const { data } = await apiClient.get<ArtifactsResponse>(`/intelligence/artifacts/${pipelineId}`);
      return data;
    },
    enabled: !!pipelineId,
    staleTime: 30000,
    retry: false,
  });

  const generateMutation = useMutation({
    mutationFn: async (): Promise<any> => {
      const { data } = await apiClient.post(`/intelligence/artifacts/${pipelineId}/generate`);
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['artifacts', pipelineId] });
      addToast({
        type: 'success',
        title: 'Artifacts generated',
        description: `Generated ${Object.keys(data.artifacts || {}).length} artifact sets`,
      });
      onGenerate?.();
    },
    onError: (error: any) => {
      addToast({
        type: 'error',
        title: 'Generation failed',
        description: error.message || 'Failed to generate artifacts',
      });
    },
  });

  const downloadArtifact = async (artifact: Artifact) => {
    try {
      const response = await fetch(`/api/intelligence/artifacts/${pipelineId}/${artifact.path}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = artifact.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      addToast({
        type: 'success',
        title: 'Download started',
        description: artifact.name,
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Download failed',
        description: 'Could not download artifact',
      });
    }
  };

  if (!pipelineId) {
    return (
      <div className="card p-6 text-center text-text-muted">
        No active pipeline. Start a pipeline to generate artifacts.
      </div>
    );
  }

  const getExtensionIcon = (ext: string) => EXTENSION_ICONS[ext] || <FileText className="text-text-muted" size={20} />;
  const getExtensionLabel = (ext: string) => EXTENSION_LABELS[ext] || ext;

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="grid grid-cols-1 gap-4">
          <Skeleton variant="text" className="w-48" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rectangular" className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 text-error-600">
          <AlertCircle size={18} />
          <span className="font-medium">Failed to load artifacts</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  const artifacts = data?.artifacts || [];

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-heading">Pipeline Artifacts</h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            icon={<Loader2 size={14} className={generateMutation.isPending ? 'animate-spin' : ''} />}
          >
            {generateMutation.isPending ? 'Generating...' : 'Generate Artifacts'}
          </Button>
        </div>
      </div>

      {artifacts.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <FileText className="mx-auto h-12 w-12 text-text-muted/50 mb-4" />
          <p className="text-sm">No artifacts generated yet</p>
          <p className="text-xs mt-1">Run a pipeline to completion, then generate artifacts</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            <Clock className="h-4 w-4 mr-2" />
            Generate Now
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {(data?.artifacts || []).map((artifact) => (
            <div
              key={artifact.path}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border border-canvas-border hover:bg-canvas-surface/50 transition-colors',
                selectedArtifact?.path === artifact.path && 'bg-brand-primary/5 border-brand-primary/20'
              )}
              onClick={() => setSelectedArtifact(selectedArtifact?.path === artifact.path ? null : artifact)}
            >
              <div className="flex-shrink-0">
                {getExtensionIcon(artifact.extension)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-heading truncate">{artifact.name}</span>
                  <Badge variant="outline" className="text-[10px]">{getExtensionLabel(artifact.extension)}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                  <span>{formatFileSize(artifact.size)}</span>
                  <span>·</span>
                  <span>{formatDate(artifact.modified)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); downloadArtifact(artifact); }}
                  disabled={false}
                >
                  <Download size={14} />
                </Button>
                {selectedArtifact?.path === artifact.path && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); setSelectedArtifact(null); }}
                    className="text-brand-primary"
                  >
                    <X size={14} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Artifact Detail Modal */}
      {selectedArtifact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-canvas rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-canvas-border flex items-center justify-between">
              <h3 className="font-semibold text-text-heading">Artifact Details</h3>
              <Button variant="ghost" size="icon" onClick={() => setSelectedArtifact(null)}>
                <X size={20} />
              </Button>
            </div>
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center gap-3">
                {getExtensionIcon(selectedArtifact.extension)}
                <div>
                  <p className="font-medium text-text-heading truncate">{selectedArtifact.name}</p>
                  <p className="text-sm text-text-muted">{getExtensionLabel(selectedArtifact.extension)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-text-muted">Size</p>
                  <p className="font-medium">{formatFileSize(selectedArtifact.size)}</p>
                </div>
                <div>
                  <p className="text-text-muted">Modified</p>
                  <p className="font-medium">{formatDate(selectedArtifact.modified)}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-canvas-border">
                <Button
                  className="w-full"
                  onClick={() => downloadArtifact(selectedArtifact)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}