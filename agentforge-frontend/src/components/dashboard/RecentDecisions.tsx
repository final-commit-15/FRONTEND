// src/components/dashboard/RecentDecisions.tsx

import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { BookOpen, CalendarDays, User } from 'lucide-react';

interface RecentDecision {
  id: string;
  title: string;
  description: string;
  made_by: string;
  date: string;
  sprint_name?: string;
}

interface RecentDecisionsProps {
  decisions: RecentDecision[];
}

export function RecentDecisions({ decisions }: RecentDecisionsProps) {
  if (!decisions || decisions.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="font-semibold text-text-heading mb-4">Recent Decisions</h3>
        <div className="text-center text-text-muted py-8">
          <BookOpen className="mx-auto h-12 w-12 text-text-muted/50 mb-4" />
          <p>No architectural decisions recorded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-text-heading mb-4">Recent Decisions</h3>
      <div className="space-y-4">
        {decisions.slice(0, 5).map((decision) => {
          return (
            <div
              key={decision.id}
              className="p-4 card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-text-heading truncate">{decision.title}</h4>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-brand-primary/10 text-brand-primary">
                      Decision
                    </span>
                  </div>
                  <p className="text-sm text-text-muted mb-2 truncate">{decision.description}</p>
                  <div className="flex items-center gap-4 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {decision.made_by}
                    </span>
                    {decision.sprint_name && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {decision.sprint_name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      {formatDistanceToNow(new Date(decision.date), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}