import React from 'react';
import { cn } from '../../lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={textareaId} className="label">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full px-4 py-3 bg-canvas-surface border rounded-xl text-sm text-text-heading placeholder-text-muted resize-y min-h-[100px]',
            'focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:bg-canvas transition-all duration-200',
            error ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20' : 'border-canvas-border',
            className
          )}
          {...props}
        />
        {hint && !error && <p className="hint">{hint}</p>}
        {error && <p className="error-text">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';