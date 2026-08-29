import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses = {
  primary: 'bg-brand-primary text-white hover:bg-brand-primary-hover focus-visible:ring-brand-primary shadow-glow-blue hover:shadow-glow-blue-hover',
  secondary: 'bg-canvas-surface text-text-heading border border-canvas-border hover:bg-canvas-glass focus-visible:ring-text-muted',
  ghost: 'text-text-body hover:bg-canvas-glass hover:text-text-heading focus-visible:ring-text-muted',
  danger: 'bg-error-50 text-error-600 border border-error-100 hover:bg-error-100 focus-visible:ring-error-500',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2.5 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200',
          'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="animate-spin" size={16} /> : icon}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';