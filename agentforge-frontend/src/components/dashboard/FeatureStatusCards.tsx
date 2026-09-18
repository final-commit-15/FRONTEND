// src/components/dashboard/FeatureStatusCards.tsx

import { Zap, AlertCircle, CheckCircle2, Archive, Clock } from 'lucide-react';

interface FeatureStatusSummary {
  planned: number;
  in_progress: number;
  in_review: number;
  completed: number;
  archived: number;
  total: number;
}

interface FeatureStatusCardsProps {
  summary: FeatureStatusSummary;
}

const statusConfig = [
  { key: 'planned', label: 'Planned', icon: Zap, color: 'text-info-500', bg: 'bg-info-100', bar: 'bg-info-500' },
  { key: 'in_progress', label: 'In Progress', icon: AlertCircle, color: 'text-brand-primary', bg: 'bg-brand-primary/10', bar: 'bg-brand-primary' },
  { key: 'in_review', label: 'In Review', icon: Clock, color: 'text-violet-500', bg: 'bg-violet-100', bar: 'bg-violet-500' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-success-500', bg: 'bg-success-100', bar: 'bg-success-500' },
  { key: 'archived', label: 'Archived', icon: Archive, color: 'text-gray-500', bg: 'bg-gray-100', bar: 'bg-gray-400' },
] as const;

export function FeatureStatusCards({ summary }: FeatureStatusCardsProps) {
  return (
    <section className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-text-heading">Features by Status</h3>
        <span className="text-xs font-medium text-text-muted tabular-nums">{summary.total} total</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {statusConfig.map(({ key, label, icon: Icon, color, bg, bar }) => {
          const count = summary[key];
          const percentage = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;

          return (
            <div
              key={key}
              className="rounded-xl border border-canvas-border bg-canvas-surface p-4 flex flex-col gap-3 min-w-0 transition-colors hover:bg-canvas-surface/60"
            >
              <div className="flex items-start justify-between gap-2">
                <div className={`h-9 w-9 shrink-0 rounded-lg ${bg} inline-flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <span className="text-[11px] font-semibold text-text-muted tabular-nums leading-none pt-1">{percentage}%</span>
              </div>

              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xl font-semibold leading-none text-text-heading tabular-nums">{count}</span>
                <span className="text-[11px] font-medium text-text-muted truncate">{label}</span>
              </div>

              <div className="mt-auto h-1.5 rounded-full bg-canvas-surface overflow-hidden">
                <div
                  className={`h-full ${bar} rounded-full transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-canvas-border flex items-center justify-between">
        <div>
          <p className="text-xs text-text-muted mb-0.5">Total Features</p>
          <p className="text-lg font-semibold leading-none text-text-heading tabular-nums">{summary.total}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted mb-0.5">Completion Rate</p>
          <p className="text-lg font-semibold leading-none text-success-500 tabular-nums">
            {summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0}%
          </p>
        </div>
      </div>
    </section>
  );
}