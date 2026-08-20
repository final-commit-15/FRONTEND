import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;  // <-- add this
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-base-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base-500 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'w-full px-3 py-2 bg-base-800/50 border rounded-lg text-sm text-white placeholder-base-500',
              'focus:border-electric-500 focus:ring-2 focus:ring-electric-500/30 transition-colors',
              icon && 'pl-10',  // adjust padding when icon present
              error ? 'border-error-500' : 'border-base-700',
              className
            )}
            {...props}
          />
        </div>
        {hint && !error && <p className="text-xs text-base-500">{hint}</p>}
        {error && <p className="text-xs text-error-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';