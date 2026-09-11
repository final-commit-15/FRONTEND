import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';
import { RotateCcw, AlertCircle, Lock, UserX, WifiOff, Server, FileQuestion, Shield } from 'lucide-react';

type ErrorType = 'default' | '401' | '403' | '404' | '422' | '500' | 'offline';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  type?: ErrorType;
  className?: string;
}

const ERROR_CONFIG: Record<ErrorType, { icon: React.ElementType; title: string; description: string }> = {
  default: {
    icon: AlertCircle,
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again.',
  },
  '401': {
    icon: Lock,
    title: 'Session expired',
    description: 'Your session has expired. Please log in again.',
  },
  '403': {
    icon: Shield,
    title: 'Access denied',
    description: 'You do not have permission to perform this action.',
  },
  '404': {
    icon: FileQuestion,
    title: 'Not found',
    description: 'The requested resource could not be found.',
  },
  '422': {
    icon: AlertCircle,
    title: 'Validation error',
    description: 'Please check your input and try again.',
  },
  '500': {
    icon: Server,
    title: 'Server error',
    description: 'Something went wrong on our end. Please try again later.',
  },
  offline: {
    icon: WifiOff,
    title: 'You\'re offline',
    description: 'Check your internet connection and try again.',
  },
};

export function ErrorState({ 
  title, 
  description, 
  onRetry, 
  retryLabel = 'Try again', 
  type = 'default', 
  className 
}: ErrorStateProps) {
  const config = ERROR_CONFIG[type];
  
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-8 text-center', className)}>
      <div className="w-16 h-16 rounded-full bg-error-500/10 flex items-center justify-center mb-4">
        <config.icon className="h-8 w-8 text-error-500" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-text-heading mb-2">{title || config.title}</h3>
      <p className="text-text-muted max-w-sm mb-6">{description || config.description}</p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry} className="gap-2">
          <RotateCcw size={16} />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

export function ErrorBoundaryFallback({ 
  error, 
  resetErrorBoundary 
}: { 
  error: Error; 
  resetErrorBoundary: () => void; 
}) {
  return (
    <ErrorState
      type="500"
      title="Something went wrong"
      description={error.message}
      onRetry={resetErrorBoundary}
      retryLabel="Reload page"
    />
  );
}

export function createErrorState(type: ErrorType, onRetry?: () => void) {
  const config = ERROR_CONFIG[type];
  return (
    <ErrorState
      type={type}
      onRetry={onRetry}
    />
  );
}