import React from 'react';
import { cn } from '../../lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, id, children, ...props }, ref) => {
    const selectId = id || React.useId();
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="label">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full px-4 py-3 bg-canvas-surface border rounded-xl text-sm text-text-heading appearance-none',
            'focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:bg-canvas transition-all duration-200',
            error ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20' : 'border-canvas-border',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {hint && !error && <p className="hint">{hint}</p>}
        {error && <p className="error-text">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';