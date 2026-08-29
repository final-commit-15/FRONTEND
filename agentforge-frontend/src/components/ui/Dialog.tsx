import React from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export function Dialog({ open, onOpenChange, children, className, title, description }: DialogProps) {
  if (!open) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onOpenChange(false);
  };

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onOpenChange(false);
  };

  React.useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, []);

  const content = (
    <div className="modal-backdrop" onClick={handleOverlayClick}>
      <div className={cn('modal-content max-w-lg', className)}>
        {(title || description) && (
          <div className="px-6 py-5 border-b border-canvas-border">
            {title && <h3 className="text-lg font-semibold text-text-heading">{title}</h3>}
            {description && <p className="text-sm text-text-body mt-1">{description}</p>}
          </div>
        )}
        <div className="p-6">
          {children}
        </div>
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 p-1 text-text-muted hover:text-text-heading rounded-lg hover:bg-canvas-surface transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: 'danger' | 'primary';
  className?: string;
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  variant = 'danger',
  className,
}: AlertDialogProps) {
  if (!open) return null;

  return createPortal(
    <div className="modal-backdrop" onClick={() => onOpenChange(false)}>
      <div
        className={cn('modal-content max-w-md animate-scale-in', className)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 text-center">
          <h3 className="text-lg font-semibold text-text-heading">{title}</h3>
          <p className="text-sm text-text-body mt-2">{description}</p>
        </div>
        <div className="px-4 py-4 border-t border-canvas-border flex gap-3 justify-end">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

import { Button } from './Button';