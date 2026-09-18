import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '../../lib/utils';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Polymorphic Select.
 *
 * Style A (compound Radix) — used by AI Project Intake, Dashboard, Tasks
 * reassign dialog and Reports. Detecting the compound children and passing
 * them straight through to a Radix Root:
 *
 *   <Select value={v} onValueChange={setV}>
 *     <SelectTrigger><SelectValue placeholder="..." /></SelectTrigger>
 *     <SelectContent>
 *       <SelectItem value="a">A</SelectItem>
 *     </SelectContent>
 *   </Select>
 *
 * Style B (simple native) — used by Agents, KnowledgeBase, GitHub Reviews,
 * TaskForm, filters etc. A styled native <select> wraps the <option> children,
 * and onChange receives the value string directly (e.target.value when the
 * caller expects an event — see handleSimpleChange):
 *
 *   <Select value={v} onChange={setV}>
 *     <option value="a">A</option>
 *   </Select>
 */

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

const isCompoundChildren = (children: React.ReactNode): boolean =>
  React.Children.toArray(children).some(
    (child) =>
      React.isValidElement(child) &&
      // Reference equality against the exact re-exported Radix primitives.
      // Robust across forwardRef objects, memo wrappers and minification —
      // pages import SelectTrigger/SelectContent from THIS module, so the
      // JSX type IS one of these objects.
      (child.type === SelectPrimitive.Trigger ||
        child.type === SelectPrimitive.Content ||
        child.type === SelectGroup)
  );

const SelectRoot = React.forwardRef<HTMLDivElement, SelectRootProps>(
  ({ label, error, hint, value, onChange, onValueChange, disabled, required, id, name, children, className }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    const compound = isCompoundChildren(children);

    const handleSimpleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      // Preserve the legacy contract: onChange receives the VALUE STRING.
      // Callers like TaskForm defensively handle both (e?.target ? e.target.value : e),
      // and value-style callers like (v) => setX(v) depend on getting the string.
      onChange?.(val);
      onValueChange?.(val);
    };

    if (compound) {
      // Style A: pass compound children through to Radix directly.
      return (
        <div ref={ref} className={cn('space-y-1.5', className)}>
          {label && (
            <label htmlFor={selectId} className="label">
              {label}
            </label>
          )}
          <SelectPrimitive.Root value={value} onValueChange={(v) => { onChange?.(v); onValueChange?.(v); }} disabled={disabled}>
            {children}
          </SelectPrimitive.Root>
          {hint && !error && <p className="hint">{hint}</p>}
          {error && <p className="error-text">{error}</p>}
        </div>
      );
    }

    // Style B: native select wrapping <option> children.
    return (
      <div ref={ref} className={cn('space-y-1.5', className)}>
        {label && (
          <label htmlFor={selectId} className="label">
            {label}
          </label>
        )}
        <select
          id={selectId}
          name={name}
          value={value}
          disabled={disabled}
          required={required}
          onChange={handleSimpleChange}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-xl border bg-canvas-surface px-4 py-2.5 text-sm text-text-heading shadow-sm transition-all duration-200',
            error
              ? 'border-error-500 focus:border-error-500 focus:ring-error-500/20'
              : 'border-canvas-border focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:bg-canvas',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {children}
        </select>
        {hint && !error && <p className="hint">{hint}</p>}
        {error && <p className="error-text">{error}</p>}
      </div>
    );
  }
);
SelectRoot.displayName = 'Select';

// Legacy native select export (unused but kept for compatibility)
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

export const Select = SelectRoot;

// Re-export Radix primitives for compound usage
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;
export const SelectTrigger = SelectPrimitive.Trigger;
export const SelectContent = SelectPrimitive.Content;
export const SelectLabel = SelectPrimitive.Label;
export const SelectItem = SelectPrimitive.Item;
export const SelectSeparator = SelectPrimitive.Separator;
