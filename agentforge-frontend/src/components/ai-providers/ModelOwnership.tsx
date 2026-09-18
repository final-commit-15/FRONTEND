// src/components/ai-providers/ModelOwnership.tsx
// Model Ownership - multi-provider model ownership tracking with tokens

import { useCallback, useEffect, useRef, useState } from 'react';
import { requirementsApi } from '@/api/requirements';
import { useProviders } from '@/context/ProviderContext';
import { Brain, Zap, Globe, Cpu, AlertCircle, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export interface OwnershipRow {
  model: string;
  name?: string;
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
  provider: string;
  tokensUsed?: number;
  tokensLimit?: number;
}

const MAX_FAILURES = 3;
const BACKOFF_MS = [2000, 4000, 8000];

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

interface ModelOwnershipProps {
  requirementId?: string;
  showTokens?: boolean;
  compact?: boolean;
}

export function ModelOwnership({ requirementId, showTokens = true, compact = false }: ModelOwnershipProps) {
  const { providers, providerHealth, providerModels } = useProviders();
  const [rows, setRows] = useState<OwnershipRow[]>([]);
  const [pipelineOwner, setPipelineOwner] = useState('');
  const [failures, setFailures] = useState(0);
  const [error, setError] = useState('');
  const failuresRef = useRef(0);
  const stoppedRef = useRef(false);

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
      
      // Enhance rows with provider info
      const models = res.models ?? [];
      const enhancedRows = models.map((r: OwnershipRow) => ({
        ...r,
        provider: r.provider || 'multi-provider',
      }));
      setRows(enhancedRows);
      setPipelineOwner(res.pipelineOwner ?? '');
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
      <Card className="border-error-200 bg-error-50/60">
        <div className="p-4">
          <div className="flex items-center gap-2 text-error-700 mb-2">
            <AlertCircle size={16} />
            <span className="text-sm font-semibold">Model ownership unavailable</span>
          </div>
          <p className="text-xs text-error-600">{error} Pipeline execution is unaffected.</p>
          <button
            onClick={retry}
            className="mt-2 text-xs font-semibold text-brand-primary hover:underline"
          >
            Retry
          </button>
        </div>
      </Card>
    );
  }

  if (rows.length === 0) {
    if (compact) return null;
    return (
      <Card className="p-6 text-center">
        <Loader2 size={24} className="mx-auto animate-spin text-brand-primary mb-2" />
        <p className="text-text-muted">Loading model ownership...</p>
      </Card>
    );
  }

  // Group rows by provider
  const rowsByProvider = rows.reduce((acc, row) => {
    if (!acc[row.provider]) acc[row.provider] = [];
    acc[row.provider].push(row);
    return acc;
  }, {} as Record<string, OwnershipRow[]>);

  const renderProviderSection = (provider: string, providerRows: OwnershipRow[]) => {
    const health = providerHealth[provider];
    const isHealthy = health?.is_healthy ?? true;
    const icon = PROVIDER_ICONS[provider];
    const label = PROVIDER_LABELS[provider] || provider;

    return (
      <div key={provider} className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-heading">
          {icon}
          <span>{label}</span>
          <Badge variant={isHealthy ? 'success' : 'error'} className="text-[10px]">
            {isHealthy ? 'Healthy' : 'Degraded'}
          </Badge>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-text-muted">
                <th className="py-1 pr-3 font-medium">Model</th>
                <th className="py-1 pr-3 font-medium">Status</th>
                <th className="py-1 pr-3 font-medium">Owner</th>
                <th className="py-1 pr-3 font-medium">Cooldown</th>
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
                    className={cn(
                      isOwner && !isSessionOnly && 'bg-brand-accent/5 font-semibold',
                      isSessionOnly && 'opacity-60'
                    )}
                  >
                    <td className="py-1 pr-3">
                      <div className="flex flex-col">
                        <span className="font-mono">{r.name || r.model}</span>
                        {isSessionOnly && (
                          <span className="text-[10px] font-medium text-orange-700">Console-only</span>
                        )}
                        {r.apiSupported === false && (
                          <span className="text-[10px] font-medium text-red-700">API Unsupported</span>
                        )}
                      </div>
                    </td>
                    <td className="py-1 pr-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border',
                        isSessionOnly && 'border-orange-300 bg-orange-50 text-orange-700',
                        isCooling && 'border-amber-300 bg-amber-50 text-amber-700',
                        isOwner && !isSessionOnly && !isCooling && 'border-brand-accent/40 bg-brand-accent/10 text-brand-accent',
                        !isOwner && !isSessionOnly && !isCooling && 'border-canvas-border text-text-muted'
                      )}>
                        {isSessionOnly ? <XCircle size={10} /> : isCooling ? <Loader2 size={10} className="animate-spin" /> : isOwner ? <CheckCircle size={10} /> : <span>·</span>}
                        {isSessionOnly ? 'Session Only' : isCooling ? 'Cooling Down' : isOwner ? 'Owner' : r.status}
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (compact) {
    // Compact view - just show pipeline owner and key stats
    const ownerRow = rows.find(r => r.model === pipelineOwner || r.owner);
    const totalModels = rows.length;
    const healthyModels = rows.filter(r => !r.sessionOnly && r.status !== 'Cooling Down').length;
    
    return (
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Pipeline Model</span>
            {ownerRow && (
              <>
                {PROVIDER_ICONS[ownerRow.provider]}
                <span className="text-sm font-mono">{ownerRow.name || ownerRow.model}</span>
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
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Model Ownership</h3>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-text-muted">
            {Object.keys(rowsByProvider).join(', ')}
          </span>
          {failures > 0 && (
            <span className="text-amber-600 text-[11px]">Retrying… ({failures}/{MAX_FAILURES})</span>
          )}
        </div>
      </div>

      {pipelineOwner && (
        <div className="mb-3 p-2 rounded-lg bg-brand-primary/5 border border-brand-primary/20">
          <p className="text-xs text-brand-primary">
            Pipeline owner: <span className="font-semibold text-brand-primary-dark">{pipelineOwner}</span>
          </p>
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(rowsByProvider).map(([provider, providerRows]) => 
          renderProviderSection(provider, providerRows)
        )}
      </div>
    </Card>
  );
}

// Need to import useQuery
import { useQuery } from '@tanstack/react-query';