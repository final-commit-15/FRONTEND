// src/components/dashboard/SprintHealthIndicator.tsx

import { cn } from '../../lib/utils';
import { CheckCircle2, AlertTriangle, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface SprintHealthProps {
  health: 'healthy' | 'at_risk' | 'delayed';
  metrics: {
    completion: number;
    daysRemaining: number;
    openBlockers: number;
    velocity: number;
    plannedVelocity: number;
  };
  onRefresh?: () => void;
}

export function SprintHealthIndicator({ health, metrics, onRefresh }: SprintHealthProps) {
  const getHealthConfig = () => {
    switch (health) {
      case 'healthy':
        return {
          label: 'Healthy',
          color: 'text-success-500',
          bg: 'bg-success-100',
          icon: CheckCircle2,
          description: 'Sprint is on track. Good velocity and manageable blockers.',
        };
      case 'at_risk':
        return {
          label: 'At Risk',
          color: 'text-warning-500',
          bg: 'bg-warning-100',
          icon: AlertTriangle,
          description: 'Sprint may be at risk. Review blockers and velocity.',
        };
      case 'delayed':
        return {
          label: 'Delayed',
          color: 'text-error-500',
          bg: 'bg-error-100',
          icon: AlertCircle,
          description: 'Sprint is behind schedule. Immediate action required.',
        };
      default:
        return {
          label: 'Unknown',
          color: 'text-text-muted',
          bg: 'bg-gray-100',
          icon: AlertCircle,
          description: 'Unable to determine sprint health.',
        };
    }
  };

  const config = getHealthConfig();
  const HealthIcon = config.icon;

  const velocityTrend = metrics.velocity >= metrics.plannedVelocity ? 'up' : 'down';

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-semibold text-text-heading">Sprint Health</h3>
          <p className="text-sm text-text-muted mt-1">AI-generated assessment based on blockers, velocity, and progress</p>
        </div>
        <div className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-xl border',
          config.bg, `border-${config.color.replace('text-', '')}20`
        )}>
        <HealthIcon className={`h-5 w-5 ${config.color}`} />
        <span className={`font-medium ${config.color}`}>{config.label}</span>
      </div>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="card p-4 text-center">
        <div className="text-2xl font-bold text-text-heading">{metrics.completion}%</div>
        <div className="text-xs text-text-muted mt-1">Completion</div>
      </div>
      <div className="card p-4 text-center">
        <div className="text-2xl font-bold text-text-heading">{metrics.daysRemaining}d</div>
        <div className="text-xs text-text-muted mt-1">Days Remaining</div>
      </div>
      <div className="card p-4 text-center">
        <div className="text-2xl font-bold text-error-500">{metrics.openBlockers}</div>
        <div className="text-xs text-text-muted mt-1">Open Blockers</div>
      </div>
      <div className="card p-4 text-center">
        <div className="flex items-center justify-center gap-1">
          <div className="text-2xl font-bold text-text-heading">{metrics.velocity}</div>
          <TrendingUp className="h-4 w-4 text-success-500" />
        </div>
        <div className="text-xs text-text-muted mt-1">Velocity ({metrics.plannedVelocity} planned)</div>
      </div>
    </div>

    <div className="p-4 rounded-xl border border-brand-primary/20 bg-brand-primary/5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-brand-primary/10 flex items-center justify-center">
          <span className="text-brand-primary">AI</span>
        </div>
        <div className="flex-1">
          <p className="font-medium text-brand-primary">AI Assessment</p>
          <p className="text-sm text-text-muted mt-1">{config.description}</p>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-success-500">
              <TrendingUp className="h-3 w-3" />
              Velocity on track
            </span>
            <span className="flex items-center gap-1 text-warning-500">
              <AlertTriangle className="h-3 w-3" />
              {metrics.openBlockers} blockers
            </span>
            <span className="flex items-center gap-1 text-text-muted">
              {metrics.daysRemaining}d left
            </span>
          </div>
        </div>
      </div>

      {onRefresh && (
        <button
          onClick={onRefresh}
          className="mt-4 w-full py-2 px-4 text-sm font-medium text-brand-primary hover:text-brand-primary-hover transition-colors"
        >
          Refresh Health Assessment
        </button>
      )}
    </div>
  </div>
  );
}