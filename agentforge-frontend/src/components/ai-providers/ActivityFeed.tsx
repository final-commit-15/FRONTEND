// src/components/ai-providers/ActivityFeed.tsx
// Upgraded Activity Feed - multi-provider AI activity with model/provider details

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2, Info, AlertTriangle, XCircle, Bot, ChevronDown, Brain, Zap, Globe, Cpu, Sparkles, ExternalLink, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ActivityEvent {
  id: string;
  event: string;
  title: string;
  detail?: string;
  kind?: string;
  stage?: string | null;
  created_at?: string;
  // New fields for multi-provider
  model?: string;
  provider?: string;
  tokens_used?: number;
  latency_ms?: number;
  fallback_reason?: string;
  switch_reason?: string;
  attempt_trace?: Array<{
    model: string;
    status: string;
    reason: string;
    latency_ms: number;
  }>;
}

const KIND_STYLES: Record<string, { icon: React.ElementType; ring: string; iconColor: string }> = {
  info: { icon: Info, ring: 'bg-info-100', iconColor: 'text-info-600' },
  running: { icon: Loader2, ring: 'bg-warning-100', iconColor: 'text-warning-600' },
  success: { icon: CheckCircle2, ring: 'bg-success-100', iconColor: 'text-success-600' },
  warning: { icon: AlertTriangle, ring: 'bg-warning-100', iconColor: 'text-warning-600' },
  error: { icon: XCircle, ring: 'bg-error-100', iconColor: 'text-error-600' },
  ai_call: { icon: Bot, ring: 'bg-brand-primary/10', iconColor: 'text-brand-primary' },
  model_switch: { icon: Sparkles, ring: 'bg-purple-100', iconColor: 'text-purple-600' },
  fallback: { icon: AlertTriangle, ring: 'bg-amber-100', iconColor: 'text-amber-600' },
  session_created: { icon: Bot, ring: 'bg-blue-100', iconColor: 'text-blue-600' },
  session_refreshed: { icon: Bot, ring: 'bg-cyan-100', iconColor: 'text-cyan-600' },
  session_expired: { icon: AlertTriangle, ring: 'bg-amber-100', iconColor: 'text-amber-600' },
};

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  'google-ai': <Brain size={12} className="text-blue-500" />,
  'groq': <Zap size={12} className="text-green-500" />,
  'openrouter': <Globe size={12} className="text-purple-500" />,
  'opencode-zen': <Cpu size={12} className="text-orange-500" />,
};

const PROVIDER_LABELS: Record<string, string> = {
  'google-ai': 'Google AI Studio',
  'groq': 'Groq',
  'openrouter': 'OpenRouter',
  'opencode-zen': 'OpenCode Zen',
};

export function ActivityFeed({ feed }: { feed: ActivityEvent[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const live = feed.filter((f) => f.kind === 'running').length > 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [feed.length]);

  const formatEventDetail = (event: ActivityEvent) => {
    const parts: string[] = [];
    if (event.model) parts.push(`Model: ${event.model}`);
    if (event.provider) parts.push(`Provider: ${PROVIDER_LABELS[event.provider] || event.provider}`);
    if (event.tokens_used) parts.push(`Tokens: ${event.tokens_used.toLocaleString()}`);
    if (event.latency_ms) parts.push(`Latency: ${event.latency_ms}ms`);
    if (event.fallback_reason) parts.push(`Fallback: ${event.fallback_reason}`);
    if (event.switch_reason) parts.push(`Switch: ${event.switch_reason}`);
    return parts.join(' · ');
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could show toast here
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-canvas-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
            <Bot size={16} className="text-brand-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-heading">AI Activity Feed</h3>
            <p className="text-[11px] text-text-muted">Live pipeline activity with multi-provider tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {live && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-success-600">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
              Live
            </span>
          )}
          <Badge variant="outline" className="text-[10px]">
            {feed.length} events
          </Badge>
        </div>
      </div>

      <div className="flex-1 max-h-[520px] overflow-y-auto px-5 py-4 space-y-3.5">
        <AnimatePresence initial={false}>
          {feed.map((item) => {
            const kind = item.kind || 'info';
            const style = KIND_STYLES[kind] || KIND_STYLES.info;
            const Icon = style.icon;
            const isOpen = Boolean(open[item.id]);
            const eventDetail = formatEventDetail(item);

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
                      {format(new Date(item.created_at || Date.now()), 'HH:mm:ss')}
                    </span>
                  </div>
                  
                  {item.detail && (
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{item.detail}</p>
                  )}

                  {eventDetail && (
                    <p className="text-[11px] text-text-muted mt-1 flex items-center gap-1">
                      <span className="text-text-muted/60">•</span>
                      {eventDetail}
                    </p>
                  )}

                  {(item.model || item.provider) && (
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      {item.provider && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          {PROVIDER_ICONS[item.provider]}
                          {PROVIDER_LABELS[item.provider] || item.provider}
                        </Badge>
                      )}
                      {item.model && (
                        <Badge variant="default" className="text-[10px] font-mono">
                          {item.model}
                        </Badge>
                      )}
                      {item.fallback_reason && (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200">
                          Fallback: {item.fallback_reason}
                        </Badge>
                      )}
                      {item.switch_reason && (
                        <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-200">
                          Switch: {item.switch_reason}
                        </Badge>
                      )}
                    </div>
                  )}

                  {item.attempt_trace && item.attempt_trace.length > 0 && (
                    <div className="mt-2">
                      <button
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:underline"
                        onClick={() => setOpen((o) => ({ ...o, [item.id]: !o[item.id] }))}
                      >
                        {isOpen ? 'Hide attempt trace' : `Show attempt trace (${item.attempt_trace.length})`}
                        <ChevronDown size={12} className={cn('transition-transform', isOpen && 'rotate-180')} />
                      </button>
                      {isOpen && (
                        <div className="mt-2 space-y-1.5 rounded-lg bg-canvas-surface/60 border border-canvas-border p-3">
                          {item.attempt_trace.map((attempt, i) => (
                            <div key={i} className="flex items-start gap-2 p-2 rounded bg-canvas border border-canvas-border/50">
                              <span className="text-[10px] text-text-muted shrink-0 w-6">{i + 1}.</span>
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs">{attempt.model}</span>
                                  <Badge variant="outline" className={cn(
                                    'text-[10px]',
                                    attempt.status === 'success' && 'text-emerald-600 border-emerald-200',
                                    attempt.status === 'quota_exhausted' && 'text-amber-600 border-amber-200',
                                    attempt.status === 'session_only' && 'text-orange-600 border-orange-200',
                                    attempt.status === 'unsupported' && 'text-red-600 border-red-200',
                                    attempt.status === 'provider_down' && 'text-red-600 border-red-200',
                                    attempt.status === 'error' && 'text-red-600 border-red-200',
                                    'text-text-muted'
                                  )}>
                                    {attempt.status}
                                  </Badge>
                                  {attempt.latency_ms > 0 && (
                                    <span className="text-[10px] text-text-muted">{attempt.latency_ms}ms</span>
                                  )}
                                </div>
                                {attempt.reason && (
                                  <p className="text-[10px] text-text-muted ml-6">{attempt.reason}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {item.kind === 'ai_call' && item.detail && (
                    <div className="mt-2">
                      <button
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary hover:underline"
                        onClick={() => setOpen((o) => ({ ...o, [item.id]: !o[item.id] }))}
                      >
                        {isOpen ? 'Hide AI output' : 'Show AI output'}
                        <ChevronDown size={12} className={cn('transition-transform', isOpen && 'rotate-180')} />
                      </button>
                      {isOpen && (
                        <div className="mt-1 rounded-lg bg-canvas border border-canvas-border p-3 max-h-64 overflow-y-auto">
                          <pre className="text-[11px] font-mono text-text-body whitespace-pre-wrap break-words">
                            {item.detail}
                          </pre>
                          <div className="mt-2 flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(item.detail || '', 'AI output')}
                              className="text-[10px]"
                            >
                              <Copy size={12} />
                              Copy
                            </Button>
                          </div>
                        </div>
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
    </Card>
  );
}