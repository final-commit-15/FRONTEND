// src/components/ui/Badge.tsx

import React from 'react';
import { cn } from '../../lib/utils';
import { STATUS_COLORS } from '../../lib/constants';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  status?: string;
}

export function Badge({ className, variant = 'neutral', status, children, ...props }: BadgeProps) {
  const colorClass = status ? STATUS_COLORS[status] : undefined;
  const variantClass = !status
    ? {
        default: 'bg-electric-500/20 text-electric-400 border-electric-500/30',
        success: 'bg-success-500/20 text-success-500 border-success-500/30',
        warning: 'bg-warning-500/20 text-warning-500 border-warning-500/30',
        error: 'bg-error-500/20 text-error-500 border-error-500/30',
        info: 'bg-info-500/20 text-info-500 border-info-500/30',
        neutral: 'bg-base-800 text-base-300 border-base-700',
      }[variant]
    : undefined;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border',
        colorClass || variantClass,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge status={status}>{status}</Badge>;
}