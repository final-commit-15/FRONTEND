// src/components/executions/ExecutionTimeline.tsx

import { CheckCircle2, Clock, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Execution, ExecutionStep } from '@/types/models';
import { formatDateTime, formatDuration } from '@/lib/format';

interface ExecutionTimelineProps {
  execution: Execution;
}

export function ExecutionTimeline({ execution }: ExecutionTimelineProps) {
  const steps = execution.timeline ?? [];

  if (steps.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Execution Timeline</h3>
        <p className="text-base-500">No timeline steps available.</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Execution Timeline</h3>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-base-800" />
        <div className="space-y-6">
          {steps.map((step) => (
            <div key={step.id} className="relative flex items-start gap-4">
              <div className="relative z-10">
                {step.status === 'completed' && (
                  <div className="w-8 h-8 rounded-full bg-success-500/20 border border-success-500 flex items-center justify-center">
                    <CheckCircle2 size={16} className="text-success-500" />
                  </div>
                )}
                {step.status === 'active' && (
                  <div className="w-8 h-8 rounded-full bg-electric-600/20 border border-electric-500 flex items-center justify-center animate-glow">
                    <Loader2 size={16} className="text-electric-400 animate-spin" />
                  </div>
                )}
                {step.status === 'failed' && (
                  <div className="w-8 h-8 rounded-full bg-error-700/20 border border-error-500 flex items-center justify-center">
                    <XCircle size={16} className="text-error-500" />
                  </div>
                )}
                {step.status === 'pending' && (
                  <div className="w-8 h-8 rounded-full bg-base-800 border border-base-700 flex items-center justify-center">
                    <Clock size={16} className="text-base-500" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={cn(
                    'font-medium',
                    step.status === 'failed' ? 'text-error-500' : 'text-white'
                  )}>
                    {step.label}
                  </p>
                  {step.timestamp && (
                    <span className="text-xs text-base-500">{formatDateTime(step.timestamp)}</span>
                  )}
                </div>
                {step.duration && (
                  <p className="text-xs text-base-500 mt-1">Duration: {formatDuration(step.duration)}</p>
                )}
                {step.metadata && Object.keys(step.metadata).length > 0 && (
                  <div className="mt-2 p-3 bg-base-800/50 rounded-lg text-xs text-base-400">
                    {Object.entries(step.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-0.5">
                        <span>{key}:</span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}