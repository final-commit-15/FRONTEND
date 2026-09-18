// src/components/intake/AgentExecutionLog.tsx
// Dedicated Agent Execution Log panel (P0 BUG 3): streams backend AI logs —
// stage started, prompt sent, waiting, success/failure, takeover, deferred.

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, ChevronDown, TerminalSquare, AlertTriangle, RefreshCw, Zap, Globe, Cpu, Brain, CheckCircle2, FileText, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import type { AIExecLog } from '@/hooks/useIntakePipeline';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const STAGE_LABELS: Record<string, string> = {
  requirements: 'Requirements Analysis',
  features: 'Feature Extraction',
  tasks: 'Task Segregation',
  engineers: 'AI Engineer Assignment',
  sprints: 'Sprint Planning',
  monitoring: 'Monitoring Summary',
};

const API_STAGE_MAP: Record<string, string> = {
  requirements: 'requirements_analysis',
  features: 'feature_extraction',
  tasks: 'task_segregation',
  engineers: 'engineer_assignment',
  sprints: 'sprint_planning',
  monitoring: 'monitoring_summary',
};

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  'google-ai': <Brain size={12} className="text-blue-500" />,
  'groq': <Zap size={12} className="text-green-500" />,
  'openrouter': <Globe size={12} className="text-purple-500" />,
  'opencode-zen': <Cpu size={12} className="text-orange-500" />,
};

const PROVIDER_LABELS: Record<string, string> = {
  'google-ai': 'Google AI Studio',
  'groq': 'Groq',
  'openrouter': 'OpenRouter',
  'opencode-zen': 'OpenCode Zen',
};

const ERROR_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  RATE_LIMITED: { label: 'Rate Limited / Quota Exhausted', icon: <AlertTriangle size={12} className="text-amber-500" /> },
  SESSION_ONLY: { label: 'Console-Only Model', icon: <AlertTriangle size={12} className="text-orange-500" /> },
  UNSUPPORTED_MODEL: { label: 'Unsupported Model', icon: <AlertTriangle size={12} className="text-red-500" /> },
  PROVIDER_DOWN: { label: 'Provider Unavailable', icon: <AlertTriangle size={12} className="text-red-500" /> },
  NETWORK_FAILURE: { label: 'Network Error', icon: <AlertTriangle size={12} className="text-red-500" /> },
  TIMEOUT: { label: 'Request Timeout', icon: <AlertTriangle size={12} className="text-red-500" /> },
  UNAUTHORIZED: { label: 'Invalid API Key', icon: <AlertTriangle size={12} className="text-red-500" /> },
  UNKNOWN: { label: 'Unknown Error', icon: <AlertTriangle size={12} className="text-red-500" /> },
};

interface FallbackInfo {
  hasFallback: boolean;
  chain: string;
  reason: string;
}

function getFallbackInfo(log: AIExecLog): FallbackInfo {
  const hasFallback = log.retryCount > 0 || (log.requestedModel && log.actualModel && log.requestedModel !== log.actualModel);
  
  if (!hasFallback) {
    return { hasFallback: false, chain: '', reason: '' };
  }

  // Build fallback chain from available data
  const requested = log.requestedModel || '—';
  const actual = log.actualModel || requested;
  
  let chain = '';
  let reason = '';
  
  if (log.errorType) {
    const errorInfo = ERROR_LABELS[log.errorType] || { label: log.errorType, icon: <AlertTriangle size={12} /> };
    reason = errorInfo.label;
  }
  
  if (requested !== actual) {
    chain = `${requested} → ${actual}`;
  } else if (log.retryCount > 0) {
    chain = `${actual} (${log.retryCount} retry${log.retryCount > 1 ? 's' : ''})`;
  }

  return { hasFallback, chain, reason };
}

export function AgentExecutionLog({
  logs,
  onInspect,
  runId,
}: {
  logs: AIExecLog[];
  onInspect?: (log: AIExecLog) => void;
  runId?: string;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const downloadArtifact = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch {}
  };

  const handleViewOutput = (stageApi: string) => {
    if (!runId) return;
    window.open(`/api/intelligence/artifacts/${runId}/${stageApi}`, '_blank');
  };
  const handleDownloadDocx = (stageApi: string) => {
    if (!runId) return;
    downloadArtifact(`/api/intelligence/artifacts/${runId}/${stageApi}/docx`, `${stageApi}.docx`);
  };
  const handleDownloadPdf = (stageApi: string) => {
    if (!runId) return;
    downloadArtifact(`/api/intelligence/artifacts/${runId}/${stageApi}/pdf`, `${stageApi}.pdf`);
  };

  return (
    <div className="card glass rounded-2xl border border-canvas-border flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-canvas-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
            <TerminalSquare size={16} className="text-brand-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-heading">Agent Execution Log</h3>
            <p className="text-[11px] text-text-muted">
              {logs.length === 0 ? 'Waiting for the first AI call…' : `${logs.length} AI call${logs.length === 1 ? '' : 's'} logged`}
            </p>
          </div>
        </div>
        {logs.length > 0 && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-success-600">
            <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
            Live
          </span>
        )}
      </div>

      <div className="flex-1 max-h-[420px] overflow-y-auto px-5 py-4 space-y-2.5">
        {logs.length === 0 && (
          <div className="flex items-start gap-3 text-xs text-text-muted">
            <Bot size={14} className="mt-0.5 shrink-0" />
            <p>
              Each stage logs here: prompt sent (model · provider · size), waiting, response
              received (latency · tokens · output size), failures and takeovers.
            </p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {logs.map((log) => {
            const failed = Boolean(log.errorType);
            const isOpen = Boolean(open[log.id]);
            const fallback = getFallbackInfo(log);
            const providerLabel = PROVIDER_LABELS[log.provider] || log.provider;
            const providerIcon = PROVIDER_ICONS[log.provider];
            const actualModel = log.actualModel || log.requestedModel || '—';
            const apiStage = API_STAGE_MAP[log.stage] || log.stage;
            const hasArtifact = !failed && !!log.response;

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'rounded-xl border px-3 py-2.5',
                  failed ? 'border-error-200 bg-error-50/50' : 'border-canvas-border bg-canvas-surface/50'
                )}
              >
                <button
                  className="w-full flex items-center gap-2 text-left"
                  onClick={() => setOpen((o) => ({ ...o, [log.id]: !o[log.id] }))}
                >
                  <span className="text-sm">{failed ? '🔴' : '🟢'}</span>
                  <span className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="block text-xs font-semibold text-text-heading truncate">
                        {STAGE_LABELS[log.stage] ?? log.stage}
                      </span>
                      <Badge variant={failed ? 'error' : 'success'} className="text-[10px]">
                        {failed ? 'Failed' : 'Completed'}
                      </Badge>
                      {hasArtifact && (
                        <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                          <FileText size={10} /> Artifact
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-text-muted font-mono">
                      <Badge variant="outline" className="text-[10px] flex items-center gap-1">
                        {providerIcon}
                        {providerLabel}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{actualModel}</Badge>
                      <span className="text-[10px]">{(log.latencyMs / 1000).toFixed(1)}s</span>
                      <span className="text-[10px]">{log.tokensUsed} tokens</span>
                      <span className="text-[10px]">{log.outputSize} chars</span>
                      <span className="text-[10px]">{log.createdAt ? format(Date.parse(log.createdAt), 'HH:mm:ss') : ''}</span>
                    </div>
                  </span>
                  <ChevronDown size={14} className={cn('text-text-muted transition-transform', isOpen && 'rotate-180')} />
                </button>
                {isOpen && (
                  <div className="mt-2 space-y-1.5 text-[11px]">
                    {!failed && runId && (
                      <div className="flex gap-2 pb-1">
                        <Button size="sm" variant="outline" onClick={() => handleViewOutput(apiStage)} className="h-7 text-[11px]">
                          <Eye size={12} className="mr-1" /> View Output
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDownloadDocx(apiStage)} className="h-7 text-[11px]">
                          <Download size={12} className="mr-1" /> Download DOCX
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(apiStage)} className="h-7 text-[11px]">
                          <FileText size={12} className="mr-1" /> Download PDF
                        </Button>
                      </div>
                    )}
                    <p className="text-text-muted flex items-center gap-1.5">
                      <span>🟣</span>
                      Prompt sent to <span className="font-mono">{log.requestedModel || '—'}</span> · {providerLabel} · {log.promptSize.toLocaleString()} chars
                    </p>
                    
                    {fallback.hasFallback && (
                      <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                        <p className="text-xs font-semibold text-amber-800 flex items-center gap-1">
                          <RefreshCw size={10} /> Fallback Detected
                        </p>
                        {fallback.chain && (
                          <p className="text-xs text-amber-700 mt-0.5 font-mono">
                            Chain: {fallback.chain}
                          </p>
                        )}
                        {fallback.reason && (
                          <p className="text-xs text-amber-700 mt-0.5">
                            Reason: {fallback.reason}
                          </p>
                        )}
                        <p className="text-xs text-amber-600 mt-0.5">
                          Retries: {log.retryCount}
                        </p>
                      </div>
                    )}
                    
                    {log.response && (
                      <p className="rounded-lg bg-canvas p-2 text-text-body whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                        {log.response.slice(0, 600)}
                        {log.response.length > 600 ? '…' : ''}
                      </p>
                    )}
                    {log.errorMessage && (
                      <p className="rounded-lg bg-error-100/60 p-2 text-error-700 break-words">{log.errorMessage}</p>
                    )}
                    {onInspect && (
                      <button
                        className="text-[11px] font-semibold text-brand-primary hover:underline"
                        onClick={() => onInspect(log)}
                      >
                        Open in AI Debug Drawer →
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}