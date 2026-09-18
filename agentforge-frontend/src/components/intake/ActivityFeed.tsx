// src/components/intake/ActivityFeed.tsx
// Backend-persisted activity timeline with expandable AI-output cards (P0 BUG 4).

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2, Info, AlertTriangle, XCircle, Bot, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { FeedItem } from '@/lib/intake';
import { cn } from '@/lib/utils';

const previewLines = (value: unknown, max = 6): string[] => {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.slice(0, max).map((v) => {
      if (typeof v === 'string') return v;
      if (v && typeof v === 'object') {
        const o = v as Record<string, unknown>;
        const title = o.title ?? o.name ?? o.task ?? o.task_title ?? o.member ?? o.member_name ?? '';
        const extra = o.description ?? o.goal ?? o.priority ?? o.status ?? '';
        return [String(title), String(extra)].filter(Boolean).join(' — ').slice(0, 140);
      }
      return String(v).slice(0, 140);
    });
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .slice(0, max)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? `${v.length} items` : String(v).slice(0, 100)}`);
  }
  return [String(value).slice(0, 200)];
};

const KIND_STYLES: Record<FeedItem['kind'], { icon: React.ElementType; ring: string; iconColor: string }> = {
  info: { icon: Info, ring: 'bg-info-100', iconColor: 'text-info-600' },
  running: { icon: Loader2, ring: 'bg-warning-100', iconColor: 'text-warning-600' },
  success: { icon: CheckCircle2, ring: 'bg-success-100', iconColor: 'text-success-600' },
  warning: { icon: AlertTriangle, ring: 'bg-warning-100', iconColor: 'text-warning-600' },
  error: { icon: XCircle, ring: 'bg-error-100', iconColor: 'text-error-600' },
};

export function ActivityFeed({ feed }: { feed: FeedItem[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const live = feed.filter((f) => f.kind === 'running').length > 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [feed.length]);

  return (
    <div className="card glass rounded-2xl border border-canvas-border flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-canvas-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
            <Bot size={16} className="text-brand-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-heading">AI Activity Feed</h3>
            <p className="text-[11px] text-text-muted">Live pipeline activity</p>
          </div>
        </div>
        {live && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-success-600">
            <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
            Live
          </span>
        )}
      </div>

      <div className="flex-1 max-h-[520px] overflow-y-auto px-5 py-4 space-y-3.5">
        <AnimatePresence initial={false}>
          {feed.map((item) => {
            const style = KIND_STYLES[item.kind];
            const Icon = style.icon;
            const lines = item.data != null ? previewLines(item.data) : [];
            const isOpen = Boolean(open[item.id]);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex gap-3"
              >
                <div
                  className={cn(
                    'mt-0.5 w-8 h-8 shrink-0 rounded-full flex items-center justify-center',
                    style.ring,
                    item.kind === 'running' && 'animate-spin'
                  )}
                >
                  <Icon size={14} className={cn(style.iconColor, item.kind === 'running' && 'animate-spin')} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-text-heading truncate">{item.title}</p>
                    <span className="text-[10px] text-text-muted font-mono shrink-0">
                      {format(item.timestamp, 'HH:mm:ss')}
                    </span>
                  </div>
                  {item.detail && (
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{item.detail}</p>
                  )}
                  {lines.length > 0 && (
                    <div className="mt-1">
                      <button
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:underline"
                        onClick={() => setOpen((o) => ({ ...o, [item.id]: !o[item.id] }))}
                      >
                        {isOpen ? 'Hide AI output' : `Show AI output (${lines.length}+)`}
                        <ChevronDown size={12} className={cn('transition-transform', isOpen && 'rotate-180')} />
                      </button>
                      {isOpen && (
                        <ul className="mt-1 space-y-1 rounded-lg bg-canvas-surface/60 border border-canvas-border p-2">
                          {lines.map((l, i) => (
                            <li key={i} className="text-[11px] text-text-body leading-snug break-words">
                              • {l}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={endRef} />
      </div>
    </div>
  );
}