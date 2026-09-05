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
        default: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
        success: 'bg-success-50 text-success-700 border-success-100',
        warning: 'bg-warning-50 text-warning-700 border-warning-100',
        error: 'bg-error-50 text-error-700 border-error-100',
        info: 'bg-info-50 text-info-700 border-info-100',
        neutral: 'bg-canvas-surface text-text-body border-canvas-border',
      }[variant]
    : undefined;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border',
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