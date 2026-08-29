import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, ...props }, ref) => {
    const inputId = id || React.useId();
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full px-4 py-3 bg-canvas-surface border rounded-xl text-sm text-text-heading placeholder-text-muted',
              'focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:bg-canvas transition-all duration-200',
              icon && 'pl-12',
              error ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20' : 'border-canvas-border',
              className
            )}
            {...props}
          />
        </div>
        {hint && !error && <p className="hint">{hint}</p>}
        {error && <p className="error-text">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';