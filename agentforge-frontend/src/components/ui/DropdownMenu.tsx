import React from 'react';
import { cn } from '../../lib/utils';
import { createPortal } from 'react-dom';

interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DropdownMenu({ children, open: controlledOpen, onOpenChange }: DropdownMenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? onOpenChange ?? (() => {}) : setUncontrolledOpen;

  const triggerRef = React.useRef<HTMLElement>(null);
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

  const context = React.useMemo(() => ({ open, setOpen, triggerRef, contentRef }), [open, setOpen, triggerRef, contentRef]);

  return (
    <DropdownMenuContext.Provider value={context}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

const DropdownMenuContext = React.createContext<{ 
  open: boolean; 
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
} | null>(null);

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('DropdownMenu components must be used within DropdownMenu');
  }
  return context;
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  children: React.ReactNode;
}

export function DropdownMenuTrigger({ asChild, children, className, ...props }: DropdownMenuTriggerProps) {
  const { open, setOpen } = useDropdownMenu();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setOpen(!open);
    props.onClick?.(e);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
      ...props,
      className: cn((children as React.ReactElement<any>).props.className, className),
    });
  }

  return (
    <button
      className={cn('inline-flex items-center justify-center', className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'end';
  sideOffset?: number;
}

export function DropdownMenuContent({ children, className, align = 'end', sideOffset = 4 }: DropdownMenuContentProps) {
  const { open } = useDropdownMenu();

  if (!open) return null;

  return (
    <div
      className={cn(
        'absolute z-50 mt-2 min-w-[180px] bg-canvas border border-canvas-border rounded-xl shadow-glass animate-scale-in p-1',
        align === 'end' ? 'right-0' : 'left-0'
      )}
      style={{ marginTop: sideOffset }}
    >
      {children}
    </div>
  );
}

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  shortcut?: string;
  destructive?: boolean;
  inset?: boolean;
  asChild?: boolean;
}

export function DropdownMenuItem({ className, icon, shortcut, destructive, inset, asChild, children, ...props }: DropdownMenuItemProps) {
  const { setOpen } = useDropdownMenu();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setOpen(false);
    props.onClick?.(e);
  };

  const baseClassName = cn(
    'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
    inset && 'pl-8',
    destructive
      ? 'text-error-600 hover:bg-error-50'
      : 'text-text-body hover:bg-canvas-surface hover:text-text-heading',
    className
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ...props,
      onClick: handleClick,
      className: cn(baseClassName, (children as React.ReactElement<any>).props.className),
    });
  }

  return (
    <button
      className={baseClassName}
      onClick={handleClick}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="flex-1 text-left">{children}</span>
      {shortcut && <kbd className="text-xs text-text-muted px-1.5 py-0.5 rounded bg-canvas-surface border border-canvas-border font-mono">{shortcut}</kbd>}
    </button>
  );
}

interface DropdownMenuSeparatorProps {
  className?: string;
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return <hr className={cn('my-1 border-canvas-border', className)} />;
}

interface DropdownMenuGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownMenuGroup({ children, className }: DropdownMenuGroupProps) {
  return <div className={cn('p-1', className)}>{children}</div>;
}

interface DropdownMenuLabelProps {
  children: React.ReactNode;
  className?: string;
  inset?: boolean;
}

export function DropdownMenuLabel({ children, className, inset }: DropdownMenuLabelProps) {
  return (
    <div className={cn('px-3 py-2 text-xs font-medium text-text-muted', inset && 'pl-8', className)}>
      {children}
    </div>
  );
}

interface DropdownMenuShortcutProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownMenuShortcut({ children, className }: DropdownMenuShortcutProps) {
  return <kbd className={cn('text-xs text-text-muted px-1.5 py-0.5 rounded bg-canvas-surface border border-canvas-border font-mono', className)}>{children}</kbd>;
}

export { DropdownMenu as DropdownMenuPrimitive };