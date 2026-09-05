import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { RotateCcw } from 'lucide-react';

interface ErrorStateProps {
  title: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function ErrorState({ title, description, onRetry, retryLabel = 'Try again', icon, className }: ErrorStateProps) {
  return (
    <div className={cn('empty-state', className)}>
      {icon || (
        <div className="empty-state-icon text-error-500/50">
          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      )}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {onRetry && (
        <Button variant="primary" onClick={onRetry} className="mt-6 gap-2">
          <RotateCcw size={16} />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}