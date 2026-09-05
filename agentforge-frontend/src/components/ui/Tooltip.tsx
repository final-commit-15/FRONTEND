import React from 'react';
import { cn } from '../../lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  delay?: number;
}

export function Tooltip({ content, children, side = 'top', align = 'center', delay = 200 }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [timeoutId, setTimeoutId] = React.useState<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const alignClasses = {
    start: side === 'top' || side === 'bottom' ? 'left-0 -translate-x-0' : 'top-0 -translate-y-0',
    center: '',
    end: side === 'top' || side === 'bottom' ? 'right-0 -translate-x-0' : 'bottom-0 -translate-y-0',
  };

  const arrowClasses = {
    top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-canvas-surface',
    bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-b-canvas-surface',
    left: 'right-[-4px] top-1/2 -translate-y-1/2 border-l-canvas-surface',
    right: 'left-[-4px] top-1/2 -translate-y-1/2 border-r-canvas-surface',
  };

  if (!React.isValidElement(children)) {
    throw new Error('Tooltip child must be a single React element');
  }

  return (
    <span className="relative inline-block" onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onFocus={showTooltip} onBlur={hideTooltip}>
      {React.cloneElement(children as React.ReactElement<any>, {
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
        onFocus: showTooltip,
        onBlur: hideTooltip,
      })}
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-3 py-1.5 text-xs font-medium text-white bg-text-heading rounded-lg shadow-glass whitespace-nowrap animate-fade-in',
            sideClasses[side],
            alignClasses[align]
          )}
        >
          {content}
          <div
            className={cn(
              'absolute w-0 h-0 border-2 border-transparent',
              arrowClasses[side]
            )}
          />
        </div>
      )}
    </span>
  );
}