// src/components/dashboard/PendingPRs.tsx

import { cn } from '../../lib/utils';
import { GitBranch, AlertCircle, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface PendingPR {
  id: string;
  number: number;
  title: string;
  repository: string;
  branch: string;
  author: string;
  feature_id?: string;
  task_id?: string;
  ai_recommendation?: 'approve' | 'reject' | 'needs_changes';
  status: string;
  updated_at: string;
}

interface PendingPRs {
  total: number;
  by_status: Record<string, number>;
  by_repository: Record<string, number>;
  prs: PendingPR[];
}

interface PendingPRsProps {
  data: PendingPRs;
}

const getRecommendationColor = (rec?: string) => {
  switch (rec) {
    case 'approve': return 'bg-success-100 text-success-700';
    case 'reject': return 'bg-error-100 text-error-700';
    case 'needs_changes': return 'bg-warning-100 text-warning-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const getRecommendationIcon = (rec?: string) => {
  switch (rec) {
    case 'approve': return <CheckCircle2 className="h-3 w-3" />;
    case 'reject': return <AlertCircle className="h-3 w-3" />;
    case 'needs_changes': return <Clock className="h-3 w-3" />;
    default: return <Clock className="h-3 w-3" />;
  }
};

export function PendingPRsComponent({ data }: PendingPRsProps) {
  if (!data.prs || data.prs.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-text-heading">Pending PR Reviews</h3>
          <span className="text-sm text-text-muted">{data.total} total</span>
        </div>
        <div className="text-center text-text-muted py-8">
          <GitBranch className="mx-auto h-12 w-12 text-text-muted/50 mb-4" />
          <p>No pull requests awaiting review</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-heading">Pending PR Reviews</h3>
        <span className="text-sm text-text-muted">{data.total} awaiting review</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-canvas-border">
              <th className="text-left p-3 text-xs font-medium text-text-muted uppercase tracking-wider">PR</th>
              <th className="text-left p-3 text-xs font-medium text-text-muted uppercase tracking-wider">Feature / Task</th>
              <th className="text-left p-3 text-xs font-medium text-text-muted uppercase tracking-wider">Engineer</th>
              <th className="text-left p-3 text-xs font-medium text-text-muted uppercase tracking-wider">Branch</th>
              <th className="text-left p-3 text-xs font-medium text-text-muted uppercase tracking-wider">AI Rec.</th>
              <th className="text-left p-3 text-xs font-medium text-text-muted uppercase tracking-wider">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-canvas-border">
            {data.prs.slice(0, 10).map((pr) => (
              <tr key={pr.id} className="hover:bg-canvas-surface/50 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-text-muted" />
                    <div>
                      <a
                        href={`#`}
                        className="font-medium text-text-heading hover:text-brand-primary"
                      >
                        #{pr.number}
                      </a>
                      <p className="text-xs text-text-muted truncate max-w-xs">{pr.title}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-sm text-text-muted">
                  {pr.feature_id && <span className="px-2 py-0.5 rounded text-xs bg-brand-primary/10 text-brand-primary mr-1">Feature</span>}
                  {pr.task_id && <span className="px-2 py-0.5 rounded text-xs bg-violet-100 text-violet-700">Task</span>}
                </td>
                <td className="p-3 text-sm text-text-muted">{pr.author}</td>
                <td className="p-3">
                  <code className="px-2 py-1 rounded bg-canvas-surface text-xs font-mono text-text-muted">
                    {pr.branch}
                  </code>
                </td>
                <td className="p-3">
                  {pr.ai_recommendation && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRecommendationColor(pr.ai_recommendation)}`}
                    >
                      {getRecommendationIcon(pr.ai_recommendation)}
                      {pr.ai_recommendation.replace('_', ' ')}
                    </span>
                  )}
                </td>
                <td className="p-3 text-sm text-text-muted">
                  {format(new Date(pr.updated_at), 'MMM d, HH:mm')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.prs.length > 10 && (
          <div className="mt-4 text-center">
            <button className="text-sm text-brand-primary hover:underline">
              View all {data.prs.length} pull requests
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { PendingPRsComponent as PendingPRs };