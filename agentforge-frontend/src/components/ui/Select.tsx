import React from 'react';
import { cn } from '../../lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, id, children, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-base-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3 py-2 bg-base-800/50 border rounded-lg text-sm text-white',
            'focus:border-electric-500 focus:ring-2 focus:ring-electric-500/30 transition-colors',
            error ? 'border-error-500' : 'border-base-700',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {hint && !error && <p className="text-xs text-base-500">{hint}</p>}
        {error && <p className="text-xs text-error-500">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';