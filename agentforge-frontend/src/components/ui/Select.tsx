import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '../../lib/utils';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

// Backward-compatible Select root component that mimics the old API
// Usage: <Select label="Label" value={value} onChange={onChange} error={error}><SelectItem value="...">Label</SelectItem></Select>
interface SelectRootProps {
  label?: string;
  error?: string;
  hint?: string;
  value?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
  children: React.ReactNode;
  className?: string;
}

const SelectRoot = React.forwardRef<HTMLDivElement, SelectRootProps>(
  ({ label, error, hint, value, onChange, onValueChange, disabled, required, id, name, children, className }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    
    const handleValueChange = (val: string) => {
      onChange?.(val);
      onValueChange?.(val);
    };

    return (
      <div ref={ref} className={cn('space-y-1.5', className)}>
        {label && (
          <label htmlFor={selectId} className="label">
            {label}
          </label>
        )}
        <SelectPrimitive.Root value={value} onValueChange={handleValueChange}>
          <SelectPrimitive.Trigger
            id={selectId}
            className={cn(
              'flex h-10 w-full items-center justify-between rounded-xl border bg-canvas-surface px-4 py-2.5 text-sm text-text-heading shadow-sm transition-all duration-200',
              error ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20' : 'border-canvas-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:bg-canvas',
              'disabled:cursor-not-allowed disabled:opacity-50',
              '[&>span]:line-clamp-1'
            )}
            disabled={disabled}
          >
            <SelectPrimitive.Value placeholder={hint} />
            <SelectPrimitive.Icon asChild>
              <ChevronDown className="h-4 w-4 text-text-muted transition-transform duration-200" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              className={cn(
                'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-xl border border-canvas-border bg-canvas-surface text-text-heading shadow-glass',
                'data-[side=bottom]:translate-y-1 data-[side=left]:translate-x-1 data-[side=right]:-translate-x-1 data-[side=top]:-translate-y-1'
              )}
            >
              <SelectPrimitive.Viewport className="p-1">
                {children}
              </SelectPrimitive.Viewport>
              <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
                <ChevronDown className="h-4 w-4" />
              </SelectPrimitive.ScrollDownButton>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
        {hint && !error && <p className="hint">{hint}</p>}
        {error && <p className="error-text">{error}</p>}
      </div>
    );
  }
);
SelectRoot.displayName = 'Select';

// Backward-compatible Select wrapper that mimics the old API
interface BackwardCompatibleSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export const OldSelect = React.forwardRef<HTMLSelectElement, BackwardCompatibleSelectProps>(
  ({ className, label, error, hint, id, children, onChange, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
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
          onChange={onChange}
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
OldSelect.displayName = 'OldSelect';

// Export SelectRoot as the main Select component for backward compatibility
export const Select = SelectRoot;

// Re-export Radix Select primitives for compound component usage
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;
export const SelectTrigger = SelectPrimitive.Trigger;
export const SelectContent = SelectPrimitive.Content;
export const SelectLabel = SelectPrimitive.Label;
export const SelectItem = SelectPrimitive.Item;
export const SelectSeparator = SelectPrimitive.Separator;