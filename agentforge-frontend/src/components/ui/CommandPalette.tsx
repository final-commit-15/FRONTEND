import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface Command {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  commands: Command[];
  isOpen: boolean;
  onClose: () => void;
  placeholder?: string;
  className?: string;
}

export function CommandPalette({
  commands,
  isOpen,
  onClose,
  placeholder = 'Type a command...',
  className,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    (cmd.subtitle && cmd.subtitle.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative w-full max-w-lg card shadow-glass animate-slide-up', className)}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-base-800">
          <Search size={18} className="text-base-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-white placeholder-base-500 outline-none"
          />
          <kbd className="text-xs text-base-500 bg-base-800 border border-base-700 rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {query.length > 0 && filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-base-500">No matching commands</div>
          ) : (
            filtered.map((cmd) => (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-800 text-left"
              >
                {cmd.icon && <span className="text-electric-400">{cmd.icon}</span>}
                <div className="flex-1">
                  <p className="text-sm text-white">{cmd.title}</p>
                  {cmd.subtitle && <p className="text-xs text-base-500">{cmd.subtitle}</p>}
                </div>
                {cmd.shortcut && (
                  <kbd className="text-xs text-base-500 bg-base-800 border border-base-700 rounded px-1.5 py-0.5">
                    {cmd.shortcut}
                  </kbd>
                )}
                <ArrowRight size={14} className="text-base-600" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}