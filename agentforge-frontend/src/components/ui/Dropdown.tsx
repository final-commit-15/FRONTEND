import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: 'start' | 'end';
  sideOffset?: number;
}

export function Dropdown({
  trigger,
  children,
  open: controlledOpen,
  onOpenChange,
  align = 'end',
  sideOffset = 4,
}: DropdownProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? onOpenChange ?? (() => {}) : setUncontrolledOpen;

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, setOpen]);

  if (!open) {
    return <>{trigger}</>;
  }

  const content = (
    <div
      ref={contentRef}
      className={cn(
        'fixed z-50 mt-2 min-w-[180px] bg-canvas border border-canvas-border rounded-xl shadow-glass animate-scale-in',
        align === 'end' ? 'right-0' : 'left-0'
      )}
    >
      <div className="p-1">{children}</div>
    </div>
  );

  return (
    <>
      <span ref={triggerRef}>{trigger}</span>
      {createPortal(content, document.body)}
    </>
  );
}

interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  shortcut?: string;
  destructive?: boolean;
  asChild?: boolean;
}

export function DropdownItem({ className, icon, shortcut, destructive, children, asChild, ...props }: DropdownItemProps) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ...props,
      className: cn(
        'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
        destructive
          ? 'text-error-600 hover:bg-error-50'
          : 'text-text-body hover:bg-canvas-surface hover:text-text-heading',
        className,
        (children as React.ReactElement<any>).props.className
      ),
    });
  }

  return (
    <button
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
        destructive
          ? 'text-error-600 hover:bg-error-50'
          : 'text-text-body hover:bg-canvas-surface hover:text-text-heading',
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="flex-1 text-left">{children}</span>
      {shortcut && <kbd className="text-xs text-text-muted px-1.5 py-0.5 rounded bg-canvas-surface border border-canvas-border font-mono">{shortcut}</kbd>}
    </button>
  );
}

interface DropdownSeparatorProps {
  className?: string;
}

export function DropdownSeparator({ className }: DropdownSeparatorProps) {
  return <hr className={cn('my-1 border-canvas-border', className)} />;
}