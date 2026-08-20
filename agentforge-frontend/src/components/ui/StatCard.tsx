import React from 'react';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: number;
  className?: string;
}

export function StatCard({ title, value, icon, trend, className }: StatCardProps) {
  const isPositive = trend !== undefined && trend > 0;
  return (
    <div className={cn('card p-6 relative overflow-hidden group', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-base-400">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-base-800/50 text-white">
            {icon}
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-1 text-sm">
          <span
            className={cn(
              'flex items-center gap-1 font-medium',
              isPositive ? 'text-success-500' : 'text-error-500'
            )}
          >
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend)}%
          </span>
          <span className="text-base-500">vs last period</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-electric-500/0 to-violet-500/0 group-hover:from-electric-500/5 group-hover:to-violet-500/5 transition-all duration-300 pointer-events-none" />
    </div>
  );
}