// src/components/ui/Switch.tsx
// Switch component

import React from 'react';
import { cn } from '../../lib/utils';

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  disabled?: boolean;
}

export function Switch({ className, label, disabled, id, ...props }: SwitchProps) {
  const inputId = id || React.useId();
  
  return (
    <label className={cn('flex items-center gap-2 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', className)}>
      <input
        type="checkbox"
        id={inputId}
        className={cn(
          'h-4 w-4 shrink-0 rounded border-canvas-border',
          'text-brand-primary focus:ring-2 focus:ring-brand-primary/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-colors duration-200'
        )}
        disabled={disabled}
        {...props}
      />
      {label && (
        <span className={cn('text-sm text-text-body', disabled && 'text-text-muted')}>
          {label}
        </span>
      )}
    </label>
  );
}