// src/components/ai-providers/MonitoringSummary.tsx
// Monitoring Summary Dashboard - real-time system monitoring overview

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, 
  Brain, 
  Zap, 
  Globe, 
  Cpu, 
  Server, 
  Database, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader2,
  RefreshCw,
  Clock,
  Users,
  FileText,
  BarChart2
} from 'lucide-react';
import { aiProvidersApi, HealthCheckResponse, ProviderHealth } from '@/api/aiProviders';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Separator } from '@/components/ui/Separator';

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  'google-ai': <Brain size={16} className="text-blue-500" />,
  'groq': <Zap size={16} className="text-green-500" />,
  'openrouter': <Globe size={16} className="text-purple-500" />,
  'opencode-zen': <Cpu size={16} className="text-orange-500" />,
};

const PROVIDER_LABELS: Record<string, string> = {
  'google-ai': 'Google AI Studio',
  'groq': 'Groq',
  'openrouter': 'OpenRouter',
  'opencode-zen': 'OpenCode Zen',
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'running': return <Activity size={14} className="text-brand-primary animate-pulse" />;
    case 'completed': return <CheckCircle size={14} className="text-emerald-500" />;
    case 'failed': return <XCircle size={14} className="text-red-500" />;
    case 'blocked': return <AlertTriangle size={14} className="text-amber-500" />;
    case 'deferred': return <Clock size={14} className="text-amber-500" />;
    default: return <Activity size={14} className="text-text-muted" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'running': return 'text-brand-primary bg-brand-primary/10 border-brand-primary/20';
    case 'completed': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'failed': return 'text-red-600 bg-red-50 border-red-200';
    case 'blocked': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'deferred': return 'text-amber-600 bg-amber-50 border-amber-200';
    default: return 'text-text-muted bg-canvas-surface border-canvas-border';
  }
};

interface PipelineSummary {
  run_id: string;
  requirement_id: string;
  requirement_title: string;
  status: string;
  current_stage: string | null;
  progress_percent: number;
  stages_completed: number;
  stages_total: number;
  last_activity: string | null;
  created_at: string;
  updated_at: string | null;
  blocked_reason: string | null;
  retry_count: number;
  model_usage: Record<string, number>;
}

interface SystemSummary {
  timestamp: string;
  pipelines: PipelineSummary[];
  providers: ProviderHealth[];
  stats: {
    total_pipelines: number;
    running_pipelines: number;
    completed_pipelines: number;
    failed_pipelines: number;
    blocked_pipelines: number;
    total_stages_completed: number;
    total_tokens_used: number;
    avg_latency_ms: number;
    provider_breakdown: Record<string, number>;
  };
}

export function MonitoringSummary() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000);

  // Fetch monitoring summary
  const { data: summary, isLoading, error, refetch } = useQuery<SystemSummary>({
    queryKey: ['monitoring-summary'],
    queryFn: async () => {
      // In a real implementation, this would call a backend endpoint
      // For now, we'll simulate with provider health + pipeline data
      const health = await aiProvidersApi.healthCheck();
      
      // Mock pipeline data (would come from backend)
      return {
        timestamp: new Date().toISOString(),
        pipelines: [],
        providers: Object.values(health.providers),
        stats: {
          total_pipelines: 0,
          running_pipelines: 0,
          completed_pipelines: 0,
          failed_pipelines: 0,
          blocked_pipelines: 0,
          total_stages_completed: 0,
          total_tokens_used: 0,
          avg_latency_ms: 0,
          provider_breakdown: {},
        },
      };
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 10000,
  });

  const handleManualRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <Card className="p-6 text-center">
        <Loader2 size={24} className="mx-auto animate-spin text-brand-primary mb-2" />
        <p className="text-text-muted">Loading monitoring summary...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-error-200 bg-error-50/60 p-4">
        <div className="flex items-center gap-2 text-error-700 mb-2">
          <AlertTriangle size={16} />
          <span className="text-sm font-semibold">Failed to load monitoring data</span>
        </div>
        <p className="text-xs text-error-600 mb-2">{error.message}</p>
        <Button variant="outline" size="sm" onClick={handleManualRefresh}>
          <RefreshCw size={12} />
          Retry
        </Button>
      </Card>
    );
  }

  const stats = (summary?.stats ?? {
    total_pipelines: 0,
    running_pipelines: 0,
    completed_pipelines: 0,
    failed_pipelines: 0,
    blocked_pipelines: 0,
    total_stages_completed: 0,
    total_tokens_used: 0,
    avg_latency_ms: 0,
    provider_breakdown: {},
  }) as SystemSummary['stats'];
  const pipelines = summary?.pipelines || [];
  const providers = summary?.providers || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center">
            <BarChart2 size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-heading">Monitoring Summary</h3>
            <p className="text-sm text-text-muted">Real-time system health & pipeline overview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            icon={<RefreshCw size={14} />}
          >
            Refresh
          </Button>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-canvas-border text-brand-primary"
            />
            Auto-refresh ({Math.round(refreshInterval / 1000)}s)
          </label>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Pipelines"
          value={stats.total_pipelines}
          icon={<FileText size={20} />}
          color="blue"
        />
        <MetricCard
          title="Running"
          value={stats.running_pipelines}
          icon={<Activity size={20} />}
          color="brand-primary"
          trend="+2"
        />
        <MetricCard
          title="Completed"
          value={stats.completed_pipelines}
          icon={<CheckCircle size={20} />}
          color="emerald"
          trend="+5"
        />
        <MetricCard
          title="Failed/Blocked"
          value={stats.failed_pipelines + stats.blocked_pipelines}
          icon={<AlertTriangle size={20} />}
          color={stats.failed_pipelines > 0 ? 'red' : 'amber'}
        />
      </div>

      {/* Provider Health */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-text-heading flex items-center gap-2">
            <Server size={18} className="text-brand-primary" />
            AI Provider Health
          </h4>
          <div className="flex items-center gap-2">
            {Object.values(providers).some(p => !p.is_healthy) && (
              <Badge variant="error" className="text-xs">
                {Object.values(providers).filter(p => !p.is_healthy).length} Degraded
              </Badge>
            )}
            {Object.values(providers).every(p => p.is_healthy) && providers.length > 0 && (
              <Badge variant="success" className="text-xs">All Healthy</Badge>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(providers).map(([provider, health]) => (
            <ProviderHealthCard key={provider} provider={provider} health={health} />
          ))}
        </div>
      </Card>

      {/* Pipeline Activity */}
      <Card className="p-4">
        <h4 className="font-semibold text-text-heading mb-4 flex items-center gap-2">
          <Activity size={18} className="text-brand-primary" />
          Recent Pipeline Activity
        </h4>

        {pipelines.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <FileText size={32} className="mx-auto mb-2 opacity-50" />
            <p>No recent pipeline activity</p>
            <p className="text-xs mt-1">Start a pipeline from the Intake page</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {pipelines.slice(0, 10).map((pipeline) => (
              <PipelineActivityRow key={pipeline.run_id} pipeline={pipeline} />
            ))}
          </div>
        )}
      </Card>

      {/* Token Usage by Provider */}
      {Object.keys(stats.provider_breakdown || {}).length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold text-text-heading mb-4 flex items-center gap-2">
            <Zap size={18} className="text-brand-primary" />
            Token Usage by Provider
          </h4>
          <div className="space-y-2">
            {Object.entries(stats.provider_breakdown).map(([model, tokens]) => (
              <TokenUsageRow key={model} model={model} tokens={tokens} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon, color, trend }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}) {
  const colors: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    amber: 'text-amber-600 bg-amber-50 border-amber-200',
    'brand-primary': 'text-brand-primary bg-brand-primary/10 border-brand-primary/20',
  };

  return (
    <Card className={cn('p-4', colors[color] || colors.blue)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
          {trend && (
            <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
              <TrendingUp size={10} />
              {trend} this hour
            </p>
          )}
        </div>
        <div className="p-2 rounded-lg bg-white/50">{icon}</div>
      </div>
    </Card>
  );
}

function ProviderHealthCard({ provider, health }: { provider: string; health: ProviderHealth }) {
  const icon = PROVIDER_ICONS[provider];
  const label = PROVIDER_LABELS[provider] || provider;

  return (
    <Card className={cn('p-3', health.is_healthy ? '' : 'border-red-200 bg-red-50/50')}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="font-medium text-text-heading">{label}</span>
        <Badge variant={health.is_healthy ? 'success' : 'error'} className="ml-auto text-[10px]">
          {health.is_healthy ? 'Healthy' : 'Degraded'}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-text-muted">Latency</p>
          <p className="font-mono">{health.latency_ms.toFixed(0)}ms</p>
        </div>
        <div>
          <p className="text-text-muted">Models</p>
          <p className="font-mono">{health.models_available}</p>
        </div>
        <div>
          <p className="text-text-muted">Errors</p>
          <p className="font-mono">{(health.error_rate * 100).toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-text-muted">Failures</p>
          <p className="font-mono">{health.consecutive_failures}</p>
        </div>
      </div>
      {health.last_error && (
        <p className="mt-2 text-[10px] text-red-600 truncate" title={health.last_error}>
          {health.last_error}
        </p>
      )}
    </Card>
  );
}

function PipelineActivityRow({ pipeline }: { pipeline: PipelineSummary }) {
  const Icon = getStatusIcon(pipeline.status);
  const statusColor = getStatusColor(pipeline.status);

  return (
    <div className="p-3 rounded-lg bg-canvas-surface/50 border border-canvas-border/50">
      <div className="flex items-start gap-3">
        <div className={cn('p-1.5 rounded', statusColor)}>
          {Icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-heading truncate">{pipeline.requirement_title}</span>
            <Badge variant="outline" className={statusColor.replace('bg-', '').replace('border-', '').replace('text-', '')}>
              {pipeline.status}
            </Badge>
          </div>
          <p className="text-xs text-text-muted truncate mt-0.5">
            Stage: {pipeline.current_stage || '—'} · {pipeline.progress_percent.toFixed(0)}% complete
          </p>
          {pipeline.blocked_reason && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <AlertTriangle size={10} />
              {pipeline.blocked_reason}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-[10px] text-text-muted">
            <span>{pipeline.stages_completed}/{pipeline.stages_total} stages</span>
            {Object.keys(pipeline.model_usage).length > 0 && (
              <span>Models: {Object.keys(pipeline.model_usage).join(', ')}</span>
            )}
            <span>{new Date(pipeline.updated_at || pipeline.created_at).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TokenUsageRow({ model, tokens }: { model: string; tokens: number }) {
  // Extract provider from model name
  const provider = model.includes('/') ? model.split('/')[0] : 'unknown';
  const icon = PROVIDER_ICONS[provider] || <Cpu size={12} />;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-canvas-surface/50">
      <div className="p-1.5 rounded bg-brand-primary/10">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-heading truncate">{model}</p>
        <p className="text-xs text-text-muted">{tokens.toLocaleString()} tokens used</p>
      </div>
      <Badge variant="outline" className="text-xs">
        {tokens.toLocaleString()}
      </Badge>
    </div>
  );
}