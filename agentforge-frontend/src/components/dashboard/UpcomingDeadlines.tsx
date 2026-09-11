// src/components/dashboard/UpcomingDeadlines.tsx

import { cn } from '../../lib/utils';
import { CalendarDays, AlertCircle, CheckCircle2, Clock, AlertTriangle, Zap, ListChecks, GitBranch } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface UpcomingDeadline {
  id: string;
  type: 'sprint' | 'feature' | 'task' | 'review';
  title: string;
  due_date: string;
  days_remaining: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface UpcomingDeadlinesProps {
  deadlines: UpcomingDeadline[];
}

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'critical': return { color: 'text-error-500', bg: 'bg-error-100', icon: AlertCircle };
    case 'high': return { color: 'text-error-500', bg: 'bg-error-100', icon: AlertTriangle };
    case 'medium': return { color: 'text-warning-500', bg: 'bg-warning-100', icon: Clock };
    case 'low': return { color: 'text-info-500', bg: 'bg-info-100', icon: CalendarDays };
    default: return { color: 'text-text-muted', bg: 'bg-gray-100', icon: CalendarDays };
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'sprint': return <CalendarDays className="h-4 w-4" />;
    case 'feature': return <Zap className="h-4 w-4" />;
    case 'task': return <ListChecks className="h-4 w-4" />;
    case 'review': return <GitBranch className="h-4 w-4" />;
    default: return <CalendarDays className="h-4 w-4" />;
  }
};

export function UpcomingDeadlines({ deadlines }: UpcomingDeadlinesProps) {
  if (!deadlines || deadlines.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="font-semibold text-text-heading mb-4">Upcoming Deadlines</h3>
        <div className="text-center text-text-muted py-8">
          <CalendarDays className="mx-auto h-12 w-12 text-text-muted/50 mb-4" />
          <p>No upcoming deadlines</p>
        </div>
      </div>
    );
  }

  const sortedDeadlines = [...deadlines].sort((a, b) => a.days_remaining - b.days_remaining);

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-text-heading mb-4">Upcoming Deadlines</h3>
      <div className="space-y-3">
        {sortedDeadlines.slice(0, 8).map((deadline) => {
          const priorityConfig = getPriorityConfig(deadline.priority);
          const isOverdue = deadline.days_remaining < 0;
          const isDueSoon = deadline.days_remaining <= 2 && deadline.days_remaining >= 0;

          return (
            <div
              key={deadline.id}
              className={cn(
                'flex items-center gap-4 p-4 card hover:shadow-md transition-shadow',
                isOverdue && 'ring-1 ring-error-500',
                isDueSoon && !isOverdue && 'ring-1 ring-warning-500'
              )}
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${priorityConfig.bg}`}>
                <priorityConfig.icon className={`h-5 w-5 ${priorityConfig.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-text-heading truncate">{deadline.title}</p>
                  <span
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      isOverdue ? 'bg-error-100 text-error-700' :
                      isDueSoon ? 'bg-warning-100 text-warning-700' :
                      'bg-success-100 text-success-700'
                    )}
                  >
                    {isOverdue ? `${Math.abs(deadline.days_remaining)}d overdue` :
                     deadline.days_remaining === 0 ? 'Due today' :
                     `${deadline.days_remaining}d left`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <span className="flex items-center gap-1">
                    {getTypeIcon(deadline.type)}
                    {deadline.type}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${priorityConfig.bg} ${priorityConfig.color}`}>
                    {deadline.priority}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-text-heading">
                  {isOverdue ? 'Overdue' : format(new Date(deadline.due_date), 'MMM d, yyyy')}
                </p>
                <p className="text-xs text-text-muted">
                  Due {format(new Date(deadline.due_date), 'HH:mm')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}