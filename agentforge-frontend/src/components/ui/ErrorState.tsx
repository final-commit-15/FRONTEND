import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({ title, description, actionLabel = 'Try again', onRetry }: ErrorStateProps) {
  return (
    <div className="card p-12 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-error-700/10 flex items-center justify-center mb-4">
        <AlertTriangle size={28} className="text-error-500" />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description && <p className="mt-2 text-sm text-base-400 max-w-sm">{description}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-6" icon={<RefreshCw size={16} />}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}