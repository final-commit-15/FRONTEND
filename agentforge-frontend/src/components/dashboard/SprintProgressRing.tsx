// src/components/dashboard/SprintProgressRing.tsx

import { cn } from '../../lib/utils';
import { SprintProgress } from '@/types/api';

interface SprintProgressRingProps {
  sprint?: SprintProgress | null;
}

export function SprintProgressRing({ sprint }: SprintProgressRingProps) {
  if (!sprint) {
    return (
      <div className="card p-6 flex items-center justify-center min-h-[200px]">
        <div className="text-center text-text-muted">
          <p className="font-medium">No Active Sprint</p>
          <p className="text-sm">Create a sprint to see progress</p>
        </div>
      </div>
    );
  }

  // Map API fields to component fields
  const name = sprint.sprint_name;
  const storyPointsTotal = sprint.story_points_total;
  const storyPointsCompleted = sprint.story_points_completed;
  const daysRemaining = sprint.days_remaining;
  const status = sprint.status;
  const completion = sprint.completion;
  const velocityValue = sprint.velocity;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-success-500';
      case 'at_risk': return 'text-warning-500';
      case 'delayed': return 'text-error-500';
      default: return 'text-text-muted';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'healthy': return 'On Track';
      case 'at_risk': return 'At Risk';
      case 'delayed': return 'Delayed';
      default: return 'Unknown';
    }
  };

  const circumference = 2 * Math.PI * 80; // radius 80
  const offset = circumference - (completion / 100) * circumference;

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-semibold text-text-heading">{name}</h3>
          <p className="text-sm text-text-muted mt-1">
            {storyPointsCompleted} / {storyPointsTotal} Story Points
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              status === 'healthy' && 'bg-success-100 text-success-700',
              status === 'at_risk' && 'bg-warning-100 text-warning-700',
              status === 'delayed' && 'bg-error-100 text-error-700'
            )}
          >
            {getStatusLabel(status)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-8">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-canvas-border"
            />
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="text-brand-primary transition-all duration-500"
              style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-text-heading">{completion}%</div>
              <div className="text-xs text-text-muted">Complete</div>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Story Points</span>
              <span className="font-medium">{storyPointsCompleted} / {storyPointsTotal}</span>
            </div>
            <div className="h-2 bg-canvas-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-primary rounded-full transition-all duration-300"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Days Remaining</span>
              <span className={cn('font-medium', daysRemaining <= 0 && 'text-error-500')}>
                {daysRemaining <= 0 ? 'Sprint Overdue' : `${daysRemaining} days`}
              </span>
            </div>
            <div className="h-2 bg-canvas-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-warning-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(0, 100 - daysRemaining * 10)}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Velocity</span>
              <span className="font-medium">{velocityValue} pts/sprint</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}