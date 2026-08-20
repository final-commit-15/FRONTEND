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
  primary: 'bg-electric-600 text-white hover:bg-electric-500 focus-visible:ring-electric-500',
  secondary: 'bg-base-800 text-base-200 hover:bg-base-700 border border-base-700 focus-visible:ring-base-600',
  ghost: 'text-base-300 hover:bg-base-800 hover:text-white focus-visible:ring-base-600',
  danger: 'bg-error-700/20 text-error-500 border border-error-700/30 hover:bg-error-700/30 focus-visible:ring-error-700',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, icon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200',
          'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-950',
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