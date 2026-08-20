import React from 'react';
import { CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface TimelineItem {
  id: string;
  title: string;
  status: 'completed' | 'active' | 'pending' | 'failed';
  timestamp?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-4 top-0 bottom-0 w-px bg-base-800" />
      <div className="space-y-6">
        {(items ?? []).map((item) => (
          <div key={item.id} className="relative flex items-start gap-4">
            <div className="relative z-10">
              {item.status === 'completed' && (
                <div className="w-8 h-8 rounded-full bg-success-500/20 border border-success-500 flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-success-500" />
                </div>
              )}
              {item.status === 'active' && (
                <div className="w-8 h-8 rounded-full bg-electric-600/20 border border-electric-500 flex items-center justify-center animate-glow">
                  <Loader2 size={16} className="text-electric-400 animate-spin" />
                </div>
              )}
              {item.status === 'failed' && (
                <div className="w-8 h-8 rounded-full bg-error-700/20 border border-error-500 flex items-center justify-center">
                  <XCircle size={16} className="text-error-500" />
                </div>
              )}
              {item.status === 'pending' && (
                <div className="w-8 h-8 rounded-full bg-base-800 border border-base-700 flex items-center justify-center">
                  <Clock size={16} className="text-base-500" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className={cn('font-medium', item.status === 'failed' ? 'text-error-500' : 'text-white')}>
                  {item.title}
                </p>
                {item.timestamp && <span className="text-xs text-base-500">{item.timestamp}</span>}
              </div>
              {item.duration !== undefined && (
                <p className="text-xs text-base-500 mt-1">Duration: {item.duration}s</p>
              )}
              {item.metadata && Object.keys(item.metadata).length > 0 && (
                <div className="mt-2 p-3 bg-base-800/50 rounded-lg text-xs text-base-400">
                  {Object.entries(item.metadata).map(([key, value]) => (
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
  );
}