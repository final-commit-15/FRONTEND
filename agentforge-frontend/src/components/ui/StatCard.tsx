import React from 'react';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trendLabel?: string;
  className?: string;
}

export function StatCard({ title, value, change, icon, trendLabel, className }: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className={cn('card-hover p-5', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-body truncate">{title}</p>
          <p className="text-2xl font-bold text-text-heading mt-1 truncate">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-success-600" />
              ) : isNegative ? (
                <TrendingDown className="w-4 h-4 text-error-600" />
              ) : (
                <Minus className="w-4 h-4 text-text-muted" />
              )}
              <span className={cn('text-sm font-medium', isPositive ? 'text-success-600' : isNegative ? 'text-error-600' : 'text-text-muted')}>
                {isPositive || isNegative ? `${Math.abs(change)}%` : 'No change'}
              </span>
              {trendLabel && (
                <span className="text-sm text-text-muted">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}