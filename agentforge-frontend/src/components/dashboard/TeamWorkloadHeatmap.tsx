// src/components/dashboard/TeamWorkloadHeatmap.tsx

import { cn } from '../../lib/utils';
import { User, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface TeamWorkloadHeatmapProps {
  workload: {
    member_id: string;
    member_name: string;
    avatar_url?: string;
    department: string;
    assigned_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    workload_percentage: number;
    status: 'underloaded' | 'balanced' | 'overloaded';
  }[];
}

export function TeamWorkloadHeatmap({ workload }: TeamWorkloadHeatmapProps) {
  if (!workload || workload.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="font-semibold text-text-heading mb-4">Team Workload</h3>
        <div className="text-center text-text-muted py-8">
          <p>No team members assigned</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overloaded': return <AlertCircle className="h-4 w-4 text-error-500" />;
      case 'underloaded': return <Clock className="h-4 w-4 text-info-500" />;
      case 'balanced': return <CheckCircle2 className="h-4 w-4 text-success-500" />;
      default: return <Clock className="h-4 w-4 text-text-muted" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overloaded': return 'bg-error-100 text-error-700';
      case 'underloaded': return 'bg-info-100 text-info-700';
      case 'balanced': return 'bg-success-100 text-success-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getBarColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-error-500';
    if (percentage >= 80) return 'bg-warning-500';
    if (percentage >= 60) return 'bg-brand-primary';
    return 'bg-success-500';
  };

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-text-heading mb-4">Team Workload</h3>
      <div className="space-y-4">
        {workload.map((member) => (
          <div key={member.member_id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary text-sm font-medium">
                  {member.member_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </div>
                <div>
                  <p className="font-medium text-text-heading">{member.member_name}</p>
                  <p className="text-xs text-text-muted">{member.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                  {getStatusIcon(member.status)}
                  {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-text-muted">
              <div className="flex items-center gap-1">
                <span className="font-medium">{member.assigned_tasks}</span>
                <span>assigned</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium text-success-500">{member.completed_tasks}</span>
                <span>done</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium text-brand-primary">{member.in_progress_tasks}</span>
                <span>in progress</span>
              </div>
            </div>

            <div className="h-2 bg-canvas-surface rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, member.workload_percentage)}%`,
                  backgroundColor: getBarColor(member.workload_percentage)
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-text-muted">
              <span>Workload</span>
              <span className="font-medium">{member.workload_percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}