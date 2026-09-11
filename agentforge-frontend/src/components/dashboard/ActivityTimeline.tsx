// src/components/dashboard/ActivityTimeline.tsx

import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  FileText, Zap, ListChecks, CalendarDays,
  MessageSquare, AlertTriangle, GitBranch,
  CheckCircle2, BookOpen, Bell, AlertCircle
} from 'lucide-react';

interface RecentActivity {
  id: string;
  type: 'requirement' | 'feature' | 'task' | 'sprint' | 'note' | 'blocker' | 'decision' | 'pr' | 'qa';
  title: string;
  description?: string;
  user_name: string;
  user_avatar?: string;
  timestamp: string;
  entity_id?: string;
  entity_type?: string;
}

interface ActivityTimelineProps {
  activities: RecentActivity[];
}

const activityConfig = {
  requirement: { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Requirement' },
  feature: { icon: Zap, color: 'text-purple-500', bg: 'bg-purple-100', label: 'Feature' },
  task: { icon: ListChecks, color: 'text-info-500', bg: 'bg-info-100', label: 'Task' },
  sprint: { icon: CalendarDays, color: 'text-brand-primary', bg: 'bg-brand-primary/10', label: 'Sprint' },
  note: { icon: MessageSquare, color: 'text-green-500', bg: 'bg-green-100', label: 'Note' },
  blocker: { icon: AlertTriangle, color: 'text-error-500', bg: 'bg-error-100', label: 'Blocker' },
  decision: { icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-100', label: 'Decision' },
  pr: { icon: GitBranch, color: 'text-violet-500', bg: 'bg-violet-100', label: 'Pull Request' },
  qa: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-100', label: 'QA' },
} as const;

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="font-semibold text-text-heading mb-4">Recent Activity</h3>
        <div className="text-center text-text-muted py-8">
          <p>No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-text-heading mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.slice(0, 15).map((activity) => {
          const config = activityConfig[activity.type] || activityConfig.task;

          return (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-4 hover:bg-canvas-surface/50 rounded-xl transition-colors"
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${config.bg}`}>
                <config.icon className={`h-5 w-5 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-text-heading truncate">{activity.title}</p>
                  <span className="text-xs text-text-muted whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </span>
                </div>
                {activity.description && (
                  <p className="text-sm text-text-muted mt-1 truncate">{activity.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {activity.user_avatar && (
                    <img
                      src={activity.user_avatar}
                      alt={activity.user_name}
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  <span className="text-xs text-text-muted font-medium">{activity.user_name}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-brand-primary/10 text-brand-primary">
                    {config.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}