// src/pages/ProjectIntakePage.tsx — P0-fixed controlled project select + upload.

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, WifiOff, FolderPlus, XCircle, RefreshCw, Upload, Play,
  FileText, Trash2, Loader2, CheckCircle2, AlertTriangle, Building2,
  Calendar, Search, History, Repeat, ChevronDown,
} from 'lucide-react';
import { useIntakePipeline } from '@/hooks/useIntakePipeline';
import type { AIExecLog } from '@/hooks/useIntakePipeline';
import { projectsApi } from '@/api/projects';
import { intakeApi } from '@/api/intake';
import { aiProvidersApi } from '@/api/aiProviders';
import { WorkflowStepper } from '@/components/intake/WorkflowStepper';
import { ActivityFeed } from '@/components/intake/ActivityFeed';
import { ModelOwnership } from '@/components/intake/ModelOwnership';
import { ProviderErrorBoundary } from '@/components/dashboard/ProviderErrorBoundary';
import { AgentExecutionLog } from '@/components/intake/AgentExecutionLog';
import { AIDebugDrawer } from '@/components/intake/AIDebugDrawer';
import { ProviderSwitcher } from '@/components/ai-providers/ProviderSwitcher';
import {
  RequirementsPanel,
  FeaturesPanel,
  TasksPanel,
  AssignmentsPanel,
  SprintsPanel,
} from '@/components/intake/StagePanels';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/useToast';
import { getStoredProvider, storeProvider } from '@/lib/providerSelection';
import { cn } from '@/lib/utils';

const STAGE_LABELS = ['Requirements', 'Features', 'Tasks', 'Engineers', 'Sprints', 'Monitoring'];

// ─── Single source of truth for upload validation (no duplicates) ───
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_EXTS = ['.pdf', '.doc', '.docx'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const SELECTED_KEY = 'agentforge.intake.selectedProjectId';
const SELECTED_OBJ_KEY = 'agentforge.intake.selectedProject';
const RECENT_KEY = 'agentforge.intake.recentProjects';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status?: string;
  client_name?: string;
  client_email?: string;
  company?: string;
  organization_name?: string;
  project_priority?: string;
  deadline?: string;
  expected_delivery_date?: string;
}

function formatFileSize(bytes: number): string {
  if (!bytes && bytes !== 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i).toLowerCase() : '';
}

function getFileIcon(file: File): React.ReactNode {
  const ext = getFileExtension(file.name);
  if (ext === '.pdf' || file.type === 'application/pdf')
    return <FileText size={20} className="text-red-500" />;
  if (ext === '.doc' || ext === '.docx')
    return <FileText size={20} className="text-blue-500" />;
  return <FileText size={20} className="text-gray-500" />;
}

/** Shared validator: extension-authoritative (browsers vary on .doc MIME), MIME secondary, 20 MB cap. */
export function validateRequirementFile(file: File): string | null {
  const ext = getFileExtension(file.name);
  if (!ALLOWED_EXTS.includes(ext)) {
    return 'Invalid file type. Please upload a PDF, DOC, or DOCX file.';
  }
  const mime = (file.type || '').toLowerCase().split(';')[0].trim();
  if (mime && mime !== 'application/octet-stream' && !ALLOWED_FILE_TYPES.includes(mime)) {
    // Allow empty/odd MIME when the extension is valid (e.g. some .doc writers),
    // but reject clearly-image/archive MIME even with a spoofed name.
    if (/^(image|video|audio|application\/(zip|x-zip|gzip|x-rar|octet-stream))/.test(mime) && ext !== '.pdf') {
      // octet-stream is tolerated above; images/archives are not.
      if (mime !== 'application/octet-stream')
        return 'Invalid file type. Please upload a PDF, DOC, or DOCX file.';
    }
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File size exceeds 20 MB limit. Current size: ${formatFileSize(file.size)}`;
  }
  if (file.size === 0) {
    return 'Empty file. Please choose a non-empty document.';
  }
  return null;
}

// ─── Controlled file picker: click + drag&drop + paste → same state ───
function FileUploadCard({
  file,
  onChange,
  onRemove,
  uploadProgress,
  error,
  isUploading,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  onRemove: () => void;
  uploadProgress?: number;
  error?: string;
  isUploading?: boolean;
}) {
  const { addToast } = useToast();
  const [isDragActive, setIsDragActive] = useState(false);
  const [successPulse, setSuccessPulse] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (next: File | null) => {
      if (!next) return;
      const err = validateRequirementFile(next);
      if (err) {
        addToast({ type: 'error', title: 'Upload rejected', description: err });
        return;
      }
      onChange(next);
      setSuccessPulse(true);
      window.setTimeout(() => setSuccessPulse(false), 1200);
      addToast({ type: 'success', title: 'File attached', description: `${next.name} · ${formatFileSize(next.size)}` });
    },
    [onChange, addToast],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      const f = e.dataTransfer.files?.[0];
      if (f) handleFileSelect(f);
    },
    [handleFileSelect],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const f = e.clipboardData.files?.[0];
      if (f) handleFileSelect(f);
    },
    [handleFileSelect],
  );

  if (!file) {
    return (
      <div
        data-testid="requirements-dropzone"
        role="button"
        tabIndex={0}
        aria-label="Upload requirements document"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPaste={handlePaste}
        className={cn(
          'flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-8 transition-all duration-200 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40',
          isDragActive
            ? 'border-brand-primary bg-brand-primary/5 scale-[1.01]'
            : 'border-canvas-border bg-canvas-surface/50 hover:border-brand-primary/50',
        )}
      >
        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <span className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center transition-colors',
            isDragActive ? 'bg-brand-primary/15' : 'bg-canvas-surface',
          )}>
            <Upload size={28} className={isDragActive ? 'text-brand-primary' : 'text-text-muted'} />
          </span>
          <div className="text-center">
            <p className="text-sm font-medium text-text-heading">
              {isDragActive ? 'Drop it — I’ll take it from here' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-text-muted mt-1">PDF, DOC, DOCX · Max 20 MB · paste works too</p>
          </div>
          <span className="text-xs font-semibold text-brand-primary">Browse files</span>
        </div>
        <input
          ref={inputRef}
          data-testid="requirements-file-input"
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            handleFileSelect(e.target.files?.[0] ?? null);
            e.target.value = '';
          }}
        />
      </div>
    );
  }

  const ext = getFileExtension(file.name).replace('.', '').toUpperCase() || 'DOC';
  const showProgress = isUploading || (uploadProgress !== undefined && uploadProgress < 100);

  return (
    <div className="space-y-3" onPaste={handlePaste}>
      <div
        data-testid="requirements-preview"
        className={cn(
          'rounded-2xl border p-4 flex items-center gap-4 transition-all',
          error
            ? 'border-error-200 bg-error-50/60'
            : successPulse
              ? 'border-emerald-300 bg-emerald-50/50 shadow-sm'
              : 'border-canvas-border bg-canvas-surface/50',
        )}
      >
        <div className="flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center bg-brand-primary/10">
          {getFileIcon(file)}
          <span className="text-[9px] font-bold text-text-muted mt-0.5">{ext}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p data-testid="requirements-file-name" className="font-medium text-text-heading truncate">
            📄 {file.name}
          </p>
          <p data-testid="requirements-file-size" className="text-xs text-text-muted mt-0.5">
            {formatFileSize(file.size)} · {ext} · {file.type || 'document'}
          </p>
          {showProgress ? (
            <div data-testid="upload-progress" className="mt-2 h-1.5 rounded-full bg-canvas-border overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-accent transition-all duration-300"
                style={{ width: `${uploadProgress ?? 0}%` }}
              />
            </div>
          ) : (
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 size={13} />
              Uploaded successfully.
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => replaceRef.current?.click()}
            disabled={isUploading}
            data-testid="requirements-replace"
            icon={<Repeat size={14} />}
          >
            Change File
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={isUploading}
            className="text-error-600 hover:text-error-700"
            data-testid="requirements-remove"
            aria-label="Remove file"
            icon={<Trash2 size={16} />}
          >
            Remove File
          </Button>
        </div>
        <input
          ref={replaceRef}
          data-testid="requirements-replace-input"
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            handleFileSelect(e.target.files?.[0] ?? null);
            e.target.value = '';
          }}
        />
      </div>

      {error && (
        <div data-testid="requirements-error" className="rounded-xl border border-error-200 bg-error-50/60 p-3 text-xs">
          <div className="flex items-center gap-2 text-error-700">
            <AlertTriangle size={14} />
            <span className="font-medium">{error}</span>
          </div>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => replaceRef.current?.click()}>
            Retry with another file
          </Button>
        </div>
      )}
    </div>
  );
}

function LiveMonitorRow({
  monitor,
  onCancel,
  onRetry,
  blockingReason,
  currentBlockedStage,
  refreshAt,
  retryAfterSeconds,
  retryAttemptCount,
  maxRetries,
  retryDisabled,
  retryBlockedReason,
}: {
  monitor: {
    status: string;
    pipelineStatus?: string;
    cancelled?: boolean;
    currentStage?: string;
    model?: string;
    pipelineOwner?: string;
    provider?: string;
    progress: number;
    stages: Array<{
      key?: string;
      label?: string;
      status?: string;
      masterStatus?: string;
      model?: string | null;
      actualModel?: string | null;
      pipelineOwner?: string | null;
      friendlyMessage?: string | null;
      error?: string | null;
      switchReason?: string | null;
      retryAfterSeconds?: number | null;
      refreshAt?: string | null;
      nextRetryAt?: string | null;
      retryAttemptCount?: number | null;
      maxRetries?: number | null;
      backoffSeconds?: number | null;
    }>;
  };
  onCancel?: () => void;
  onRetry?: () => void;
  blockingReason?: string | null;
  currentBlockedStage?: string | null;
  refreshAt?: string | null;
  retryAfterSeconds?: number | null;
  retryAttemptCount?: number | null;
  maxRetries?: number | null;
  retryDisabled?: boolean;
  retryBlockedReason?: string;
}) {
  // P0: progress comes from the backend run row only — never inferred from
  // stage positions. Backend statuses are canonical (pending/running/
  // completed/blocked/failed, normalized upstream); 'success' is legacy.
  const completedIdx = Math.max(...monitor.stages.map((s, i) => (s.status === 'completed' ? i : -1)), -1);
  const pct = typeof monitor.progress === 'number' && monitor.progress > 0
    ? Math.round(monitor.progress)
    : 0;
  const runningStage = monitor.stages.find((s) => s.status === 'running');
  const modelInUse = monitor.pipelineOwner || monitor.model || runningStage?.actualModel || runningStage?.model;
  const stateLabel = monitor.pipelineStatus ?? monitor.status;
  const active = ['running', 'started', 'deferred'].includes(stateLabel);
  const blockedStages = monitor.stages.filter((s) => s.status === 'blocked');
  const problemStages = monitor.stages.filter((s) => s.status === 'failed' || s.status === 'error' || s.status === 'deferred');
  const stayPaused = stateLabel === 'deferred' || stateLabel === 'failed';
  const showReason = problemStages.length > 0 && (stayPaused || stateLabel === 'completed');
  const liveCountdown = (s: { nextRetryAt?: string | null; refreshAt?: string | null; retryAfterSeconds?: number | null }) => {
    if (s.nextRetryAt) {
      const seconds = Math.max(0, Math.round((new Date(s.nextRetryAt).getTime() - Date.now()) / 1000));
      if (seconds > 0) return `Retry in ${seconds}s automatically.`;
    }
    if (s.refreshAt) {
      const seconds = Math.max(0, Math.round((new Date(s.refreshAt).getTime() - Date.now()) / 1000));
      if (seconds > 0) return `Retry in ${seconds}s automatically.`;
    }
    if (s.retryAfterSeconds) return `Retry in ${s.retryAfterSeconds}s automatically.`;
    return 'Retrying automatically.';
  };
  return (
    <div className="rounded-2xl border border-canvas-border bg-canvas p-4">
      {blockingReason && currentBlockedStage && (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs">
          <p className="font-semibold text-amber-800 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            Waiting for model refresh: {currentBlockedStage}
          </p>
          <p className="mt-1 leading-relaxed text-amber-800 break-words">{blockingReason}</p>
          <p className="mt-1 text-[11px] opacity-80">
            {(() => {
              if (refreshAt) {
                const sec = Math.max(0, Math.round((new Date(refreshAt).getTime() - Date.now()) / 1000));
                if (sec > 0) return `Retry in ${sec}s automatically.`;
              }
              if (retryAfterSeconds) return `Retry in ${retryAfterSeconds}s automatically.`;
              return 'Retrying automatically.';
            })()}
            {retryAttemptCount && maxRetries ? ` (attempt ${retryAttemptCount}/${maxRetries})` : ''}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-accent">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent" />
            </span>
            {monitor.cancelled ? 'CANCELLED' : (() => {
              if (monitor.currentStage) {
                const cur = monitor.stages.find((s) => s.label === monitor.currentStage || s.key === monitor.currentStage);
                const ms = cur?.masterStatus;
                if (ms === 'switching_model') return 'SWITCHING AI MODEL';
                if (ms === 'waiting_for_refresh') return 'WAITING FOR REFRESH';
                if (ms === 'blocked') return 'BLOCKED';
              }
              if (blockedStages.length > 0 && stateLabel === 'running') return 'BLOCKED';
              return stateLabel.toUpperCase();
            })()}
          </span>
          {monitor.currentStage && <span className="text-xs text-text-muted">· {monitor.currentStage}</span>}
          {modelInUse && (
            <span className="text-xs text-text-muted">
              · {modelInUse}{monitor.provider ? ` (${monitor.provider})` : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums text-text-muted">{pct}%</span>
          {active && onCancel && (
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-text-muted hover:text-error-600 transition-colors"
            >
              <XCircle size={13} />
              Cancel
            </button>
          )}
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-canvas-border overflow-hidden mb-3">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-accent transition-all duration-700 animate-pulse"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {monitor.stages.map((s, i) => {
          const label = s.label ?? STAGE_LABELS[i] ?? `Stage ${i + 1}`;
          const running = s.status === 'running';
          const done = s.status === 'completed';
          const failed = s.status === 'failed';
          const deferred = s.status === 'deferred';
          const blocked = s.status === 'blocked';
          const switched = Boolean(s.switchReason);
          const shownModel = s.actualModel ?? s.model;
          const ms = s.masterStatus;
          const isSwitching = ms === 'switching_model';
          const isWaitingRefresh = ms === 'waiting_for_refresh';
          return (
            <span
              key={`${label}-${i}`}
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
                running
                  ? 'border-brand-accent/40 bg-brand-accent/10 text-brand-accent animate-pulse'
                  : done
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : failed
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : deferred
                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                        : blocked
                          ? 'border-red-300 bg-red-50 text-red-700'
                          : isSwitching
                            ? 'border-brand-primary/40 bg-brand-primary/10 text-brand-primary'
                            : isWaitingRefresh
                              ? 'border-amber-300 bg-amber-50 text-amber-700'
                              : 'border-canvas-border text-text-muted'
              }`}
            >
              {running && <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />}
              {done ? '✓' : failed ? '✕' : deferred ? '◷' : blocked ? '🚫' : isSwitching ? '⟳' : isWaitingRefresh ? '◷' : '·'} {label}
              {shownModel ? ` · ${shownModel}` : ''}
              {switched && !running && <span className="font-semibold" title={`Model switched: ${s.switchReason}`}>⇄</span>}
            </span>
          );
        })}
      </div>
      {showReason && (
        <div className="mt-3 space-y-2">
          {problemStages.map((s) => {
            const label = s.label ?? s.key ?? 'Stage';
            const ms = s.masterStatus;
            const isSwitching = ms === 'switching_model';
            const isWaitingRefresh = ms === 'waiting_for_refresh';
            const failed = s.status === 'failed' || s.status === 'error';
            const msg = s.friendlyMessage || s.error || s.switchReason || (s.status === 'deferred' ? 'All models temporarily unavailable — retrying when quota refreshes.' : s.status === 'blocked' ? 'Blocked because a previous stage failed.' : 'Stage failed.');
            return (
              <div
                key={`reason-${label}`}
                className={`rounded-xl border px-3 py-2 text-xs ${
                  s.status === 'deferred' || isWaitingRefresh
                    ? 'border-amber-200 bg-amber-50/70 text-amber-800'
                    : 'border-red-200 bg-red-50/70 text-red-700'
                }`}
              >
                <p className="font-semibold">
                  {s.status === 'deferred' ? '◷' : failed ? '✕' : isSwitching ? '⟳' : isWaitingRefresh ? '◷' : '·'} {label}{' '}
                  {s.status === 'deferred' ? 'deferred' : failed ? 'failed' : isSwitching ? 'switching model' : isWaitingRefresh ? 'waiting for refresh' : ''}
                </p>
                <p className="mt-0.5 leading-relaxed break-words">{msg}</p>
                {(s.status === 'deferred' || isWaitingRefresh) && (
                  <p className="mt-1 text-[11px] opacity-80">{liveCountdown(s)}</p>
                )}
              </div>
            );
          })}
          {onRetry && (
            <button
              onClick={onRetry}
              disabled={retryDisabled || blockedStages.length > 0}
              title={retryDisabled ? retryBlockedReason : blockedStages.length > 0 ? 'Blocked stages must be resolved first' : undefined}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                retryDisabled || blockedStages.length > 0
                  ? 'text-text-muted cursor-not-allowed opacity-50'
                  : 'text-brand-primary hover:text-brand-primary-dark'
              }`}
            >
              <RefreshCw size={13} />
              {retryDisabled ? 'Retry blocked' : blockedStages.length > 0 ? 'Blocked stages must be resolved' : 'Retry this stage'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const LOADING_PHASES = [
  'Uploading document...',
  'Parsing document...',
  'Creating intake...',
  'Requirements Analysis...',
];

export function ProjectIntakePage() {
  const navigate = useNavigate();
  const pipeline = useIntakePipeline();
  const { addToast } = useToast();
  const [inspectedLog, setInspectedLog] = useState<AIExecLog | null>(null);

  // ─── Controlled project selection (single source of truth) ───
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    try {
      return window.localStorage.getItem(SELECTED_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [selectedProject, setSelectedProject] = useState<Project | null>(() => {
    try {
      const raw = window.localStorage.getItem(SELECTED_OBJ_KEY);
      return raw ? (JSON.parse(raw) as Project) : null;
    } catch {
      return null;
    }
  });
  const [projectSearch, setProjectSearch] = useState('');
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      return JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? '[]') as string[];
    } catch {
      return [];
    }
  });

  // ─── Controlled requirements file ───
  const [requirementFile, setRequirementFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  // Provider selection persists across refresh and syncs with every switcher.
  const [selectedProvider, setSelectedProvider] = useState(() => getStoredProvider() || 'opencode-zen');
  const [selectedModel, setSelectedModel] = useState('');

  const projectsQuery = useQuery({
    queryKey: ['projects', 'intake-list'],
    queryFn: () => projectsApi.list(),
    retry: false,
  });

  const providersQuery = useQuery({
    queryKey: ['ai-providers'],
    queryFn: aiProvidersApi.listProviders,
    retry: false,
    staleTime: 30_000,
  });

  const allProjects: Project[] = useMemo(() => {
    const raw = projectsQuery.data;
    if (Array.isArray(raw)) return raw as Project[];
    return [];
  }, [projectsQuery.data]);

  // Show every project (active first) with status badge — never hide Upcoming.
  const intakeProjects = useMemo(() => {
    const rank = (s?: string) => {
      const v = String(s ?? '').toLowerCase();
      if (v === 'active') return 0;
      if (v === 'ongoing') return 1;
      if (v === 'upcoming') return 2;
      return 3;
    };
    return [...allProjects].sort((a, b) => rank(a.status) - rank(b.status));
  }, [allProjects]);

  // Reconcile persisted selection once projects load; keep it visible after refresh.
  useEffect(() => {
    if (!selectedProjectId || intakeProjects.length === 0) return;
    const found = intakeProjects.find((p) => String(p.id) === selectedProjectId);
    if (found) {
      setSelectedProject((prev) => {
        const same = prev && String(prev.id) === String(found.id) && prev.name === found.name;
        return same ? prev : { ...(found as Project), id: String((found as Project).id) };
      });
    }
  }, [intakeProjects, selectedProjectId]);

  // Persist selection + recents.
  useEffect(() => {
    try {
      if (selectedProjectId) window.localStorage.setItem(SELECTED_KEY, selectedProjectId);
      else window.localStorage.removeItem(SELECTED_KEY);
    } catch { /* ignore */ }
  }, [selectedProjectId]);
  useEffect(() => {
    try {
      if (selectedProject) window.localStorage.setItem(SELECTED_OBJ_KEY, JSON.stringify(selectedProject));
      else window.localStorage.removeItem(SELECTED_OBJ_KEY);
    } catch { /* ignore */ }
  }, [selectedProject]);
  useEffect(() => {
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(recentIds.slice(0, 5)));
    } catch { /* ignore */ }
  }, [recentIds]);

  const handleProjectSelect = useCallback(
    (value: string) => {
      // 1. Save project ID + 2. full object first — these drive the trigger
      // display and the selected-project card synchronously.
      setSelectedProjectId(value);
      const project = intakeProjects.find((p) => String(p.id) === value) ?? null;
      if (project) {
        const full: Project = { ...project, id: String(project.id) };
        setSelectedProject(full);
        // Defer recents until after Radix closes: adding a second SelectItem
        // with the same value while the close animation runs confuses the
        // Radix selection model and can clear the just-chosen value.
        const id = full.id;
        window.setTimeout(() => {
          setRecentIds((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 5));
        }, 200);
      } else {
        setSelectedProject(null);
      }
      setProjectSearch('');
    },
    [intakeProjects],
  );

  const filteredProjects = useMemo(() => {
    const q = projectSearch.trim().toLowerCase();
    if (!q) return intakeProjects;
    return intakeProjects.filter((p) =>
      [p.name, p.client_name, p.organization_name, p.company, p.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [intakeProjects, projectSearch]);

  const recentProjects = useMemo(
    () => recentIds
      .map((id) => intakeProjects.find((p) => String(p.id) === id))
      .filter((p): p is Project => Boolean(p)),
    [recentIds, intakeProjects],
  );

  const fileError = requirementFile ? validateRequirementFile(requirementFile) : null;

  const providers = providersQuery.data?.providers ?? [];
  const connectedProviders = providers.filter((p) => p.connected);
  const providerAvailable = connectedProviders.length > 0 || Boolean(providersQuery.data?.default_provider);
  const effectiveProvider =
    connectedProviders.some((p) => p.provider === selectedProvider)
      ? selectedProvider
      : (providersQuery.data?.default_provider || connectedProviders[0]?.provider || 'opencode-zen');
  // Explicit model wins; otherwise the selected provider's backend-reported
  // default model becomes the stage-0 owner hint (no hardcoded model names).
  const effectiveModel =
    selectedModel ||
    connectedProviders.find((p) => p.provider === effectiveProvider)?.default_model ||
    providers.find((p) => p.provider === effectiveProvider)?.default_model ||
    '';

  const handleProviderChange = useCallback((p: string) => {
    setSelectedProvider(p);
    storeProvider(p);
  }, []);

  const canStart = Boolean(selectedProject && requirementFile && !fileError && providerAvailable && !isSubmitting && !pipeline.busy);
  const disabledReason = !selectedProject
    ? 'Select a project.'
    : !requirementFile
      ? 'Upload requirements.'
      : fileError
        ? fileError
        : !providerAvailable
          ? 'No provider configured.'
          : '';

  // Loading-phase cycler while submitting.
  useEffect(() => {
    if (!isSubmitting) return;
    setLoadingPhase(0);
    const t = window.setInterval(() => setLoadingPhase((p) => Math.min(p + 1, LOADING_PHASES.length - 1)), 900);
    return () => window.clearInterval(t);
  }, [isSubmitting]);

  const handleStart = useCallback(async () => {
    if (!selectedProject || !requirementFile) return;
    // Verify the selected project still exists before execution.
    const exists = intakeProjects.some((p) => String(p.id) === String(selectedProject.id));
    if (!exists) {
      addToast({ type: 'error', title: 'Project missing', description: 'The selected project no longer exists. Pick another project.' });
      return;
    }
    const err = validateRequirementFile(requirementFile);
    if (err) {
      addToast({ type: 'error', title: 'Upload rejected', description: err });
      return;
    }
    if (!providerAvailable) {
      addToast({ type: 'error', title: 'No provider', description: 'No provider configured. Add API keys in Settings.' });
      return;
    }
    if (isSubmitting || pipeline.busy) return; // prevent double clicks
    setIsSubmitting(true);
    setUploadProgress(0);
    const tick = window.setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === undefined || prev >= 90) return prev;
        return prev + 10;
      });
    }, 120);

    try {
      // P0 contract: multipart project_id + file + provider + model → 200.
      await intakeApi.upload({
        projectId: String(selectedProject.id),
        file: requirementFile,
        provider: effectiveProvider,
        model: effectiveModel,
      });
      setUploadProgress(100);
      addToast({ type: 'success', title: 'Requirements uploaded', description: 'Requirements Analysis starts automatically.' });
      pipeline.start({
        projectName: String(selectedProject.name ?? ''),
        description: String(selectedProject.description ?? ''),
        sourceText: '',
        file: requirementFile,
        clientName: String(selectedProject.client_name ?? ''),
        clientEmail: String(selectedProject.client_email ?? ''),
        company: String(selectedProject.organization_name ?? selectedProject.company ?? ''),
        projectPriority: String(selectedProject.project_priority ?? 'medium'),
        expectedDeliveryDate: String(selectedProject.deadline ?? selectedProject.expected_delivery_date ?? ''),
        provider: effectiveProvider,
        model: effectiveModel,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed. Please retry.';
      addToast({ type: 'error', title: 'Start execution failed', description: msg });
    } finally {
      window.clearInterval(tick);
      window.setTimeout(() => {
        setUploadProgress(undefined);
        setIsSubmitting(false);
      }, 800);
    }
  }, [selectedProject, requirementFile, intakeProjects, providerAvailable, isSubmitting, pipeline, effectiveProvider, effectiveModel, addToast]);

  const openMonitor = () => navigate('/monitor');

  const atMonitorStop = pipeline.monitoring?.stages?.some(
    (s) => (s.key === 'monitoring' || s.label === 'Monitoring') && (s.status === 'completed' || s.status === 'success'),
  );

  const currentPanel = (() => {
    switch (pipeline.stage) {
      case 0:
        return (
          <RequirementsPanel
            key="req"
            requirements={pipeline.requirements}
            onChange={pipeline.setRequirements}
            phase={pipeline.phase}
            loadingText={pipeline.loadingText}
            onContinue={pipeline.proceedToNext}
            onRetry={pipeline.retryCurrentStage}
            backendStatus={pipeline.stageStatus(0)}
            busy={pipeline.busy}
          />
        );
      case 1:
        return (
          <FeaturesPanel
            key="feat"
            features={pipeline.features}
            onChange={pipeline.setFeatures}
            phase={pipeline.phase}
            loadingText={pipeline.loadingText}
            onContinue={pipeline.proceedToNext}
            onRetry={pipeline.retryCurrentStage}
            backendStatus={pipeline.stageStatus(1)}
            busy={pipeline.busy}
          />
        );
      case 2:
        return (
          <TasksPanel
            key="tasks"
            tasks={pipeline.tasks}
            onChange={pipeline.setTasks}
            phase={pipeline.phase}
            loadingText={pipeline.loadingText}
            onContinue={pipeline.proceedToNext}
            onRetry={pipeline.retryCurrentStage}
            backendStatus={pipeline.stageStatus(2)}
            busy={pipeline.busy}
          />
        );
      case 3:
        return (
          <AssignmentsPanel
            key="assign"
            tasks={pipeline.tasks}
            members={pipeline.members}
            assignments={pipeline.assignments}
            matches={pipeline.matches}
            onChangeAssignments={pipeline.setAssignments}
            phase={pipeline.phase}
            loadingText={pipeline.loadingText}
            onContinue={pipeline.proceedToNext}
            onRetry={pipeline.retryCurrentStage}
            backendStatus={pipeline.stageStatus(3)}
            busy={pipeline.busy}
          />
        );
      case 4:
        return (
          <SprintsPanel
            key="sprints"
            sprints={pipeline.sprints}
            tasks={pipeline.tasks}
            assignments={pipeline.assignments}
            phase={pipeline.phase}
            loadingText={pipeline.loadingText}
            persistedCount={pipeline.persistedSprints.length}
            onOpenMonitor={openMonitor}
            onRetry={pipeline.retryCurrentStage}
            backendStatus={pipeline.stageStatus(4)}
            busy={pipeline.busy}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <div className="page-container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center shadow-glow-blue">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-heading font-heading">AI Project Intake</h1>
            <p className="text-sm text-text-muted">
              From brief to sprint — analyze the brief, extract features, segregate tasks, assign engineers and plan sprints.
            </p>
          </div>
        </div>
        {pipeline.started && (
          <Button variant="outline" size="sm" onClick={pipeline.reset}>
            <FolderPlus size={14} />
            New Intake
          </Button>
        )}
      </div>

      {!pipeline.started ? (
        <div className="mx-auto max-w-3xl space-y-5">
          <Card className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-text-heading">Select a project</h2>
              <p className="text-sm text-text-muted">Projects created on the Projects page appear here. Pick one, upload the client requirements, then start execution.</p>
            </div>

            {projectsQuery.isLoading ? (
              <Skeleton variant="rectangular" className="h-12 w-full" />
            ) : intakeProjects.length === 0 ? (
              <EmptyState
                title="No active projects"
                description="Create a project on the Projects page and set it to Active — it will appear here for AI intake."
                action={<Button onClick={() => navigate('/projects')}>Go to Projects</Button>}
              />
            ) : (
              <>
                <div className="space-y-2">
                  <label className="label" htmlFor="project-select">Project *</label>
                  <Select value={selectedProjectId} onValueChange={handleProjectSelect}>
                    <SelectTrigger
                      id="project-select"
                      data-testid="project-select-trigger"
                      className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-canvas-border bg-canvas-surface px-4 py-2.5 text-sm text-text-heading shadow-sm transition-all duration-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:bg-canvas hover:border-text-muted/40"
                    >
                      {selectedProject ? (
                        <span data-testid="project-select-value" className="truncate font-medium">
                          {selectedProject.name}
                        </span>
                      ) : (
                        <SelectValue placeholder="Choose a project" />
                      )}
                      <ChevronDown size={16} className="text-text-muted shrink-0" />
                    </SelectTrigger>
                    <SelectContent
                      data-testid="project-select-content"
                      className="bg-canvas-surface border border-canvas-border rounded-xl shadow-lg p-1 min-w-[280px] max-h-[340px] overflow-auto"
                    >
                      <div className="sticky top-0 p-1.5 bg-canvas-surface z-10" onKeyDown={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 rounded-lg border border-canvas-border bg-canvas px-2.5 py-1.5">
                          <Search size={14} className="text-text-muted shrink-0" />
                          <input
                            data-testid="project-search-input"
                            value={projectSearch}
                            onChange={(e) => setProjectSearch(e.target.value)}
                            placeholder="Search projects..."
                            className="w-full bg-transparent text-sm text-text-heading placeholder:text-text-muted outline-none"
                          />
                        </div>
                      </div>
                      {recentProjects.length > 0 && !projectSearch && (
                        <>
                          <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted flex items-center gap-1">
                            <History size={11} /> Recently used
                          </p>
                          {recentProjects.map((p) => (
                            <SelectItem
                              key={`recent-${String(p.id)}`}
                              value={String(p.id)}
                              data-testid={`project-recent-${String(p.id)}`}
                              className="flex items-center px-3 py-2 text-sm text-text-heading rounded-lg cursor-pointer data-[highlighted]:bg-brand-primary/10 data-[highlighted]:text-brand-primary data-[selected]:bg-brand-primary/10 data-[selected]:text-brand-primary outline-none"
                            >
                              <span className="font-medium">{String(p.name)}</span>
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {filteredProjects.length === 0 ? (
                        <p className="px-3 py-4 text-xs text-text-muted text-center">No projects match “{projectSearch}”.</p>
                      ) : (
                        filteredProjects.map((p) => (
                          <SelectItem
                            key={String(p.id)}
                            value={String(p.id)}
                            data-testid={`project-option-${String(p.id)}`}
                            className="flex items-center px-3 py-2 text-sm text-text-heading rounded-lg cursor-pointer data-[highlighted]:bg-brand-primary/10 data-[highlighted]:text-brand-primary data-[selected]:bg-brand-primary/10 data-[selected]:text-brand-primary outline-none"
                          >
                            <div className="flex flex-col gap-0.5 w-full">
                              <span className="flex items-center gap-2 font-medium">
                                <span className="truncate">{String(p.name)}</span>
                                {p.status && (
                                  <span className={cn(
                                    'text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0',
                                    String(p.status).toLowerCase() === 'active'
                                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                                      : 'border-canvas-border bg-canvas text-text-muted',
                                  )}>
                                    {String(p.status)}
                                  </span>
                                )}
                              </span>
                              {(p.client_name || p.organization_name || p.company) && (
                                <span className="text-xs text-text-muted truncate">
                                  {p.client_name ? String(p.client_name) : ''}
                                  {p.client_name && (p.organization_name || p.company) ? ' · ' : ''}
                                  {String(p.organization_name ?? p.company ?? '')}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  {selectedProject && (
                    <div data-testid="selected-project-card" className="mt-2 p-3 rounded-xl bg-brand-primary/5 border border-brand-primary/20">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                          <FolderPlus size={14} className="text-brand-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p data-testid="selected-project-name" className="text-sm font-medium text-text-heading truncate">
                            {selectedProject.name}
                          </p>
                          <p className="text-xs text-text-muted flex items-center gap-1 flex-wrap">
                            {selectedProject.client_name && (
                              <span className="inline-flex items-center gap-1">
                                <Building2 size={10} />
                                <span data-testid="selected-project-client">{selectedProject.client_name}</span>
                              </span>
                            )}
                            {(selectedProject.organization_name || selectedProject.company) && (
                              <span className="inline-flex items-center gap-1">
                                <span className="text-text-muted">·</span>
                                <span
                                  data-testid="selected-project-org"
                                  className="inline-flex items-center gap-0.5 rounded-full border border-brand-primary/30 bg-white/60 px-1.5 py-px font-medium"
                                >
                                  <Building2 size={10} />
                                  {selectedProject.organization_name ?? selectedProject.company}
                                </span>
                              </span>
                            )}
                            {(selectedProject.deadline || selectedProject.expected_delivery_date) && (
                              <span className="inline-flex items-center gap-1">
                                <span className="text-text-muted">·</span>
                                <Calendar size={10} />
                                <span>Due {String(selectedProject.deadline ?? selectedProject.expected_delivery_date).slice(0, 10)}</span>
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="label">Requirements document (PDF / Word) *</label>
                  <FileUploadCard
                    file={requirementFile}
                    onChange={setRequirementFile}
                    onRemove={() => setRequirementFile(null)}
                    uploadProgress={uploadProgress}
                    error={fileError ?? undefined}
                    isUploading={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Button
                    disabled={!canStart}
                    onClick={handleStart}
                    data-testid="start-execution-button"
                    title={disabledReason || undefined}
                    icon={isSubmitting || pipeline.busy ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                  >
                    {isSubmitting || pipeline.busy ? LOADING_PHASES[loadingPhase] : 'Start execution'}
                  </Button>
                  {isSubmitting && (
                    <p data-testid="intake-loading-phase" className="text-xs text-brand-primary font-medium">
                      {LOADING_PHASES[loadingPhase]}
                    </p>
                  )}
                  {!selectedProject && <p className="text-xs text-text-muted">Select a project to continue.</p>}
                  {selectedProject && !requirementFile && (
                    <p className="text-xs text-text-muted">Upload the requirements document to enable Start execution.</p>
                  )}
                  {disabledReason && (selectedProject || requirementFile) && (
                    <p data-testid="start-disabled-reason" className="text-xs text-text-muted">{disabledReason}</p>
                  )}
                  {!providerAvailable && (
                    <p className="text-xs text-amber-700 flex items-center gap-1">
                      <AlertTriangle size={12} /> No provider configured. Add API keys in Settings.
                    </p>
                  )}
                </div>

                <Card className="p-5 mt-4">
                  <h3 className="text-sm font-semibold text-text-heading mb-2">How it runs</h3>
                  <ol className="text-xs text-text-muted space-y-1.5 list-decimal list-inside">
                    <li>Model 1 reads the requirements document and extracts requirements.</li>
                    <li>Model 2 turns requirements into features.</li>
                    <li>Model 3 segregates tasks, assigns team members and estimates deadlines.</li>
                    <li>The pipeline parks at Monitor with a yellow pulse — that is the stop point.</li>
                  </ol>
                </Card>
              </>
            )}
          </Card>
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px] items-start">
            <div className="space-y-5 min-w-0">
              <WorkflowStepper current={pipeline.stage} phase={pipeline.phase} loadingText={pipeline.loadingText} />

              {atMonitorStop && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Monitoring — pipeline parked here</p>
                    <p className="text-xs text-amber-700">Tasks are assigned with deadlines. Continue tracking in Monitor.</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={openMonitor} className="ml-auto">Open Monitor</Button>
                </div>
              )}

              {pipeline.monitoring.status !== 'idle' && (
                <LiveMonitorRow
                  monitor={pipeline.monitoring}
                  onCancel={pipeline.cancelPipeline}
                  onRetry={pipeline.retryCurrentStage}
                  blockingReason={pipeline.blockingReason}
                  currentBlockedStage={pipeline.currentBlockedStage}
                  refreshAt={pipeline.refreshAt}
                  retryAfterSeconds={pipeline.retryAfterSeconds}
                  retryAttemptCount={pipeline.retryAttemptCount}
                  maxRetries={pipeline.maxRetries}
                  retryDisabled={pipeline.retryDisabled}
                  retryBlockedReason={pipeline.retryBlockedReason}
                />
              )}

              <AnimatePresence mode="wait">
                {pipeline.error && (
                  <motion.div
                    key="error-banner"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl border border-error-200 bg-error-50/70 p-4 flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-error-100 flex items-center justify-center shrink-0">
                      <WifiOff size={15} className="text-error-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-error-700">Backend unavailable</p>
                      <p className="text-xs text-error-600 mt-0.5">{pipeline.error}</p>
                      <div className="flex gap-2 mt-2.5">
                        <Button size="sm" variant="outline" onClick={pipeline.reset}>
                          Start over
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentPanel && (
                  <motion.div
                    key={`panel-${pipeline.stage}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="card glass rounded-2xl border border-canvas-border p-5"
                  >
                    {currentPanel}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="lg:sticky lg:top-20 space-y-5">
              <ProviderSwitcher
                onProviderChange={handleProviderChange}
              />
              <ProviderErrorBoundary>
                <ModelOwnership requirementId={(pipeline.monitoring as { requirementId?: string }).requirementId} />
              </ProviderErrorBoundary>
              <AgentExecutionLog logs={pipeline.execLogs} onInspect={setInspectedLog} runId={pipeline.jobId} />
              <ActivityFeed feed={pipeline.activityFeed.length > 0 ? pipeline.activityFeed : pipeline.feed} />
            </div>
          </div>
        </>
      )}

      <AIDebugDrawer log={inspectedLog} onClose={() => setInspectedLog(null)} />
    </div>
  );
}
