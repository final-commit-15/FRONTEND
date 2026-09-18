// src/components/ui/Label.tsx
// Label component

import React from 'react';
import { cn } from '../../lib/utils';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'block text-sm font-medium text-text-heading mb-1.5',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-error-500 ml-0.5" aria-hidden="true">*</span>}
    </label>
  );
}