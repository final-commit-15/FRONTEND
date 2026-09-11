// src/components/dashboard/FeatureStatusCards.tsx

import { cn } from '../../lib/utils';
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
  { key: 'planned', label: 'Planned', icon: Zap, color: 'text-info-500', bg: 'bg-info-100' },
  { key: 'in_progress', label: 'In Progress', icon: AlertCircle, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
  { key: 'in_review', label: 'In Review', icon: Clock, color: 'text-violet-500', bg: 'bg-violet-100' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-success-500', bg: 'bg-success-100' },
  { key: 'archived', label: 'Archived', icon: Archive, color: 'text-gray-500', bg: 'bg-gray-100' },
] as const;

export function FeatureStatusCards({ summary }: FeatureStatusCardsProps) {
  return (
    <div className="card p-6">
      <h3 className="font-semibold text-text-heading mb-4">Features by Status</h3>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statusConfig.map(({ key, label, icon: Icon, color, bg }) => {
          const count = summary[key as keyof FeatureStatusSummary] as number;
          const percentage = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;

          return (
            <div key={key} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <span className="text-xs text-text-muted">{percentage}%</span>
              </div>
              <div className="text-2xl font-bold text-text-heading">{summary[key as keyof FeatureStatusSummary]}</div>
              <div className="text-xs text-text-muted">{label}</div>
              <div className="mt-2 h-1.5 bg-canvas-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-primary rounded-full transition-all duration-300"
                  style={{ width: `${summary.total > 0 ? (summary[key as keyof FeatureStatusSummary] as number) / summary.total * 100 : 0}%` }}
                />
              </div>
            </div>
          );
        })}
        <div className="card p-4 lg:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Total Features</p>
              <p className="text-2xl font-bold text-text-heading">{summary.total}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">Completion Rate</span>
              <span className="text-xl font-bold text-success-500">
                {summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}