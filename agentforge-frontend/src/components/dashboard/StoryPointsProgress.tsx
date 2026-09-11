// src/components/dashboard/StoryPointsProgress.tsx

import { cn } from '../../lib/utils';

interface StoryPointsProgressProps {
  completed: number;
  total: number;
  title?: string;
}

export function StoryPointsProgress({ completed, total, title = 'Story Points' }: StoryPointsProgressProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-heading">{title}</h3>
        <span className="text-sm text-text-muted">{completed} / {total} pts</span>
      </div>

      <div className="h-3 bg-canvas-surface rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-brand-primary to-violet-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-text-muted">Progress</span>
        <span className="font-semibold text-text-heading">{percentage}%</span>
      </div>

      <div className="mt-4 pt-4 border-t border-canvas-border">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-text-heading">{completed}</div>
            <div className="text-xs text-text-muted">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-text-heading">{total - completed}</div>
            <div className="text-xs text-text-muted">Remaining</div>
          </div>
        </div>
      </div>
    </div>
  );
}