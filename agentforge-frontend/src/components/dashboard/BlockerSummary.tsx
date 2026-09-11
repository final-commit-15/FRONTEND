// src/components/dashboard/BlockerSummary.tsx

import { cn } from '../../lib/utils';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

interface BlockerSummary {
  total: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  oldest_open: { id: string; title: string; days_open: number } | null;
}

interface BlockerSummaryProps {
  data: BlockerSummary;
}

const statusConfig = {
  open: { label: 'Open', color: 'text-error-500', bg: 'bg-error-100', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'text-warning-500', bg: 'bg-warning-100', icon: Clock },
  resolved: { label: 'Resolved', color: 'text-success-500', bg: 'bg-success-100', icon: CheckCircle2 },
  wont_fix: { label: 'Won\'t Fix', color: 'text-gray-500', bg: 'bg-gray-100', icon: AlertTriangle },
} as const;

const priorityConfig = {
  critical: { label: 'Critical', color: 'text-error-500', bg: 'bg-error-100' },
  high: { label: 'High', color: 'text-error-500', bg: 'bg-error-100' },
  medium: { label: 'Medium', color: 'text-warning-500', bg: 'bg-warning-100' },
  low: { label: 'Low', color: 'text-info-500', bg: 'bg-info-100' },
} as const;

export function BlockerSummary({ data }: BlockerSummaryProps) {
  const openCount = data.by_status?.open || 0;
  const inProgressCount = data.by_status?.in_progress || 0;
  const resolvedCount = data.by_status?.resolved || 0;

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-semibold text-text-heading">Blocker Summary</h3>
          <p className="text-sm text-text-muted mt-1">Tracking impediments across sprints</p>
        </div>
        <div className="flex items-center gap-2 p-3 bg-error-50 rounded-xl border border-error-100">
          <AlertCircle className="h-5 w-5 text-error-500" />
          <span className="text-sm font-medium text-error-700">
            {openCount} Open Blockers
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <AlertCircle className="h-6 w-6 text-error-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-text-heading">{data.by_status?.open || 0}</div>
          <div className="text-xs text-text-muted mt-1">Open</div>
        </div>
        <div className="card p-4 text-center">
          <Clock className="h-6 w-6 text-warning-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-text-heading">{data.by_status?.in_progress || 0}</div>
          <div className="text-xs text-text-muted mt-1">In Progress</div>
        </div>
        <div className="card p-4 text-center">
          <CheckCircle2 className="h-6 w-6 text-success-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-text-heading">{data.by_status?.resolved || 0}</div>
          <div className="text-xs text-text-muted mt-1">Resolved</div>
        </div>
        <div className="card p-4 text-center">
          <TrendingUp className="h-6 w-6 text-brand-primary mx-auto mb-2" />
          <div className="text-2xl font-bold text-text-heading">{data.total}</div>
          <div className="text-xs text-text-muted mt-1">Total</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-4">
          <h4 className="font-medium text-text-heading mb-4">By Status</h4>
          <div className="space-y-3">
            {Object.entries(statusConfig).map(([key, config]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <config.icon className={`h-4 w-4 ${config.color}`} />
                  <span className="text-sm text-text-heading">{config.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 bg-canvas-surface rounded-full flex-1 max-w-32 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${config.bg}`}
                      style={{ width: `${data.total > 0 ? ((data.by_status[key] || 0) / data.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-text-heading w-10 text-right">
                    {data.by_status[key] || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h4 className="font-medium text-text-heading mb-4">By Priority</h4>
          <div className="space-y-3">
            {Object.entries(priorityConfig).map(([key, config]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="text-sm text-text-heading">{config.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 bg-canvas-surface rounded-full flex-1 max-w-32 overflow-hidden">
                    <div
                      className="h-full bg-brand-primary rounded-full transition-all duration-300"
                      style={{ width: `${data.total > 0 ? ((data.by_priority[key] || 0) / data.total) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-text-heading w-10 text-right">
                    {data.by_priority[key] || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {data.oldest_open && (
        <div className="mt-6 p-4 card border-error-200 bg-error-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-error-500" />
            <div className="flex-1">
              <p className="font-medium text-error-700">Oldest Open Blocker</p>
              <p className="text-sm text-error-600 mt-1">{data.oldest_open.title}</p>
              <p className="text-xs text-error-500 mt-1">
                Open for {data.oldest_open.days_open} days
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}