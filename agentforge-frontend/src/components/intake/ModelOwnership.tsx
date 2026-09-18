import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Clock, Database, Zap, Wifi, WifiOff, AlertCircle, CheckCircle2, AlertCircle as AlertCircleIcon } from 'lucide-react';
import { requirementsApi } from '@/api/requirements';
import { cn } from '@/lib/utils';

export interface OwnershipRow {
  model: string;
  name?: string;
  provider: string;
  status: string;
  rawStatus?: string;
  sessionOnly?: boolean;
  apiSupported?: boolean;
  availability?: string;
  owner: boolean;
  cooldown: string;
  retryAfterSeconds?: number;
  refreshAt?: string | null;
  reason?: string | null;
  excludedFromPipeline?: boolean;
  tags?: string[];
  latency_ms?: number;
  tokensUsed?: number;
  lastUsed?: string | null;
  health?: string;
}

const MAX_FAILURES = 3;
const BACKOFF_MS = [2000, 4000, 8000];

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  'google-ai': (
    <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.33,0-6.033-2.703-6.033-6.032s2.703-6.032,6.033-6.032c1.518,0,2.818,0.734,3.573,1.81l2.585-2.585C17.299,4.162,15.118,3,12.545,3C7.031,3,2.563,7.467,2.563,13s4.468,10,10,10c8.27,0,12.95-6.742,10.429-15H12.545z"/>
    </svg>
  ),
  'groq': (
    <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
  ),
  'openrouter': (
    <svg className="w-4 h-4 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
    </svg>
  ),
  'opencode-zen': (
    <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>
  ),
};

const PROVIDER_LABELS: Record<string, string> = {
  'google-ai': 'Google AI Studio',
  'groq': 'Groq',
  'openrouter': 'OpenRouter',
  'opencode-zen': 'OpenCode Zen',
};

interface ModelOwnershipProps {
  requirementId?: string;
  showTokens?: boolean;
  compact?: boolean;
}

export function ModelOwnership({ requirementId, showTokens = true, compact = false }: ModelOwnershipProps) {
  const [rows, setRows] = useState<OwnershipRow[]>([]);
  const [pipelineOwner, setPipelineOwner] = useState('');
  const [provider, setProvider] = useState('');
  const [failures, setFailures] = useState(0);
  const [error, setError] = useState('');
  const failuresRef = useRef(0);
  const stoppedRef = useRef(false);
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    if (stoppedRef.current || failuresRef.current >= MAX_FAILURES) return;
    try {
      const res = await requirementsApi.getModelOwnership(requirementId);
      if ((res as { status?: string }).status === 'error') {
        throw new Error((res as { message?: string }).message || 'Ownership unavailable');
      }
      failuresRef.current = 0;
      setFailures(0);
      setError('');
      setRows(res.models ?? []);
      setPipelineOwner(res.pipelineOwner ?? '');
      setProvider((res as { provider?: string }).provider ?? '');
    } catch (e) {
      failuresRef.current += 1;
      setFailures(failuresRef.current);
      if (failuresRef.current >= MAX_FAILURES) {
        stoppedRef.current = true;
        setError(e instanceof Error ? e.message : 'Model ownership unavailable.');
      } else {
        const delay = BACKOFF_MS[Math.min(failuresRef.current - 1, BACKOFF_MS.length - 1)];
        window.setTimeout(() => void load(), delay);
      }
    }
  }, [requirementId]);

  useEffect(() => {
    failuresRef.current = 0;
    stoppedRef.current = false;
    setFailures(0);
    setError('');
    void load();
    const id = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(id);
  }, [load]);

  const retry = () => {
    failuresRef.current = 0;
    stoppedRef.current = false;
    setFailures(0);
    setError('');
    void load();
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-error-200 bg-error-50/60 p-4">
        <p className="text-sm font-semibold text-error-700">Model ownership unavailable</p>
        <p className="text-xs text-error-600 mt-1">{error} Pipeline execution is unaffected.</p>
        <button
          onClick={retry}
          className="mt-2 text-xs font-semibold text-brand-primary hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (rows.length === 0) return null;

  // Filter out Qwen models from display
  const displayRows = rows.filter(r => !r.model.toLowerCase().includes('qwen'));

  // Group rows by provider, filtering out rows with missing provider
  const rowsByProvider = displayRows.filter(r => r.provider).reduce((acc, row) => {
    const key = row.provider || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {} as Record<string, OwnershipRow[]>);

  const handleToggleProvider = (provider: string) => {
    setExpandedProviders(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  if (compact) {
    // Compact view - just show pipeline owner and key stats
    const ownerRow = displayRows.find(r => r.model === pipelineOwner || r.owner);
    const totalModels = displayRows.length;
    const healthyModels = displayRows.filter(r => !r.sessionOnly && r.status !== 'Cooling Down').length;

    return (
      <div className="rounded-2xl border border-canvas-border bg-canvas p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Pipeline Owner</span>
            {ownerRow && (
              <>
                {PROVIDER_ICONS[ownerRow.provider]}
                <span className="text-sm">
                  <span className="font-medium">{PROVIDER_LABELS[ownerRow.provider] || ownerRow.provider || 'Unknown'}</span>
                  <span className="text-text-muted mx-1">•</span>
                  <span className="font-mono">{ownerRow.name || ownerRow.model}</span>
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span>{healthyModels}/{totalModels} models healthy</span>
            {failures > 0 && (
              <span className="text-amber-600">Retrying… ({failures}/{MAX_FAILURES})</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  const renderProviderSection = (provider: string, providerRows: OwnershipRow[]) => {
    const safeProvider = provider || 'unknown';
    const icon = PROVIDER_ICONS[safeProvider];
    const label = PROVIDER_LABELS[safeProvider] || safeProvider || 'Unknown Provider';
    const isExpanded = expandedProviders[safeProvider] ?? false;

    return (
      <div key={provider} className="card overflow-hidden">
        <button
          onClick={() => setExpandedProviders(prev => ({ ...prev, [provider]: !prev[provider] }))}
          className="w-full p-3 flex items-center justify-between gap-4 hover:bg-canvas-surface/30 transition-colors text-left"
          aria-expanded={expandedProviders[provider] ?? false}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {icon}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-text-heading truncate">{label}</span>
                <span className="text-sm text-text-muted">({providerRows.length})</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-text-muted mt-1">
                <span className="flex items-center gap-1">
                  <Database size={10} /> {providerRows.length} models
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={10} /> {providerRows.filter(r => r.latency_ms).reduce((sum, r) => sum + (r.latency_ms || 0), 0) / Math.max(1, providerRows.filter(r => r.latency_ms).length) | 0}ms avg
                </span>
              </div>
            </div>
          </div>
          <ChevronRight
            size={18}
            className={cn(
              'text-text-muted transition-transform flex-shrink-0',
              expandedProviders[safeProvider] && 'rotate-90'
            )}
          />
        </button>

        <AnimatePresence>
          {(expandedProviders[safeProvider] ?? false) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-canvas-border bg-canvas-surface/30"
            >
              <div className="p-4 space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-text-muted">
                        <th className="py-1 pr-3 font-medium">Model</th>
                        <th className="py-1 pr-3 font-medium">Status</th>
                        <th className="py-1 pr-3 font-medium">Owner</th>
                        <th className="py-1 pr-3 font-medium">Cooldown</th>
                        <th className="py-1 pr-3 font-medium">Latency</th>
                        <th className="py-1 font-medium">Health</th>
                      </tr>
                    </thead>
                    <tbody>
                      {providerRows.map((r) => {
                        const isOwner = r.owner || r.model === pipelineOwner;
                        const isSessionOnly = r.sessionOnly;
                        const isCooling = r.status === 'Cooling Down';

                        return (
                          <tr
                            key={r.model}
                            className={!r.sessionOnly && isOwner ? 'bg-brand-accent/5 font-semibold' : ''}
                          >
                            <td className="py-1 pr-3">
                              <div className="flex flex-col">
                                <span className="font-mono">{r.name || r.model}</span>
                                {r.excludedFromPipeline && (
                                  <span className="text-[10px] font-medium text-destructive">Excluded from Pipeline</span>
                                )}
                                {isSessionOnly && (
                                  <span className="text-[10px] font-medium text-orange-700">Console-only</span>
                                )}
                                {r.apiSupported === false && (
                                  <span className="text-[10px] font-medium text-red-700">API Unsupported</span>
                                )}
                              </div>
                            </td>
                            <td className="py-1 pr-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                                isSessionOnly
                                  ? 'border-orange-300 bg-orange-50 text-orange-700'
                                  : isCooling
                                  ? 'border-amber-300 bg-amber-50 text-amber-700'
                                  : isOwner
                                  ? 'border-brand-accent/40 bg-brand-accent/10 text-brand-accent'
                                  : 'border-canvas-border text-text-muted'
                              }`}>
                                {isSessionOnly ? '🔒' : isCooling ? '🟡' : isOwner ? '⭐' : '·'} {isSessionOnly ? 'Session Only' : isCooling ? 'Cooling Down' : isOwner ? 'Current Owner' : r.status}
                              </span>
                              {isSessionOnly && (
                                <p className="text-[10px] text-orange-600/80 mt-0.5">Unavailable for API</p>
                              )}
                              {r.reason && !isSessionOnly && (
                                <p className="text-[10px] text-amber-600/80 mt-0.5">{r.reason}</p>
                              )}
                            </td>
                            <td className="py-1 pr-3">{isSessionOnly ? '—' : isOwner ? 'Yes' : 'No'}</td>
                            <td className="py-1 tabular-nums">{isSessionOnly ? '—' : r.cooldown}</td>
                            <td className="py-1 tabular-nums">{r.latency_ms ? `${r.latency_ms}ms` : '—'}</td>
                            <td className="py-1">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] ${
                                r.health === 'healthy' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' :
                                r.health === 'degraded' ? 'border-amber-300 bg-amber-50 text-amber-700' :
                                'border-red-300 bg-red-50 text-red-700'
                              }`}>
                                {r.health === 'healthy' ? '🟢' : r.health === 'degraded' ? '🟡' : '🔴'} {r.health || '—'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-error-200 bg-error-50/60 p-4">
        <p className="text-sm font-semibold text-error-700">Model ownership unavailable</p>
        <p className="text-xs text-error-600 mt-1">{error} Pipeline execution is unaffected.</p>
        <button
          onClick={retry}
          className="mt-2 text-xs font-semibold text-brand-primary hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (rows.length === 0) return null;

  if (compact) {
    // Compact view - just show pipeline owner and key stats
    const ownerRow = displayRows.find(r => r.model === pipelineOwner || r.owner);
    const totalModels = displayRows.length;
    const healthyModels = displayRows.filter(r => !r.sessionOnly && r.status !== 'Cooling Down').length;

    return (
      <div className="rounded-2xl border border-canvas-border bg-canvas p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Pipeline Owner</span>
            {ownerRow && (
              <>
                {PROVIDER_ICONS[ownerRow.provider]}
                <span className="text-sm">
                  <span className="font-medium">{PROVIDER_LABELS[ownerRow.provider] || ownerRow.provider || 'Unknown'}</span>
                  <span className="text-text-muted mx-1">•</span>
                  <span className="font-mono">{ownerRow.name || ownerRow.model}</span>
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span>{healthyModels}/{totalModels} models healthy</span>
            {failures > 0 && (
              <span className="text-amber-600">Retrying… ({failures}/{MAX_FAILURES})</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  const ownerRow = displayRows.find(r => r.model === pipelineOwner || r.owner);

  return (
    <div className="rounded-2xl border border-canvas-border bg-canvas p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Model Ownership</h3>
        <span className="text-[11px] text-text-muted">Provider: {PROVIDER_LABELS[provider] || provider || '—'}</span>
      </div>
      {pipelineOwner && ownerRow && (
        <div className="mb-3 p-2 rounded-lg bg-brand-primary/5 border border-brand-primary/20">
          <p className="text-xs text-brand-primary font-medium">Pipeline Owner</p>
          <p className="text-xs text-brand-primary">
            Provider: <span className="font-semibold text-brand-primary-dark">{PROVIDER_LABELS[ownerRow.provider] || ownerRow.provider || 'Unknown'}</span>
          </p>
          <p className="text-xs text-brand-primary">
            Current Model: <span className="font-semibold text-brand-primary-dark">{ownerRow.name || ownerRow.model}</span>
          </p>
        </div>
      )}
      <div className="space-y-4">
        {Object.entries(rowsByProvider).map(([provider, providerRows]) =>
          renderProviderSection(provider, providerRows)
        )}
      </div>
      {failures > 0 && (
        <p className="mt-1 text-[11px] text-text-muted">Retrying… ({failures}/{MAX_FAILURES})</p>
      )}
    </div>
  );
}