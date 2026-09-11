import React from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, children, className }: DialogProps) {
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onOpenChange(false);
  };

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onOpenChange(false);
  };

  React.useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const content = (
    <div className="modal-backdrop" onClick={handleOverlayClick}>
      <div className={cn('modal-content max-w-lg', className)}>
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

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogContent({ children, className }: DialogContentProps) {
  return <div className={cn('', className)}>{children}</div>;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
  return <div className={cn('space-y-2', className)}>{children}</div>;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return <h3 className={cn('text-lg font-semibold text-text-heading', className)}>{children}</h3>;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogDescription({ children, className }: DialogDescriptionProps) {
  return <p className={cn('text-sm text-text-body', className)}>{children}</p>;
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return <div className={cn('flex justify-end gap-3 mt-4 pt-4 border-t border-canvas-border', className)}>{children}</div>;
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