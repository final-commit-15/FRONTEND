// src/components/intake/WorkflowStepper.tsx

import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, FileText, Sparkles, ListChecks, Brain, TrendingUp, ChevronDown } from 'lucide-react';
import { STAGES, StagePhase } from '@/lib/intake';
import { cn } from '@/lib/utils';

const STAGE_ICONS = [FileText, Sparkles, ListChecks, Brain, TrendingUp, TrendingUp];

type Status = 'done' | 'current' | 'pending';

function statusOf(i: number, current: number, phase: StagePhase): Status {
  if (i < current) return 'done';
  if (phase === 'done' && i === 5) return 'done';
  if (phase === 'done') return 'done';
  if (i === current) return 'current';
  return 'pending';
}

function Connector({ prev }: { prev: Status }) {
  if (prev === 'done') {
    return (
      <div className="flex justify-center py-1">
        <div className="h-5 w-0.5 rounded-full bg-gradient-to-b from-brand-primary to-brand-primary/30" />
      </div>
    );
  }
  if (prev === 'current') {
    return (
      <div className="flex justify-center py-0.5">
        <motion.div
          animate={{ y: [0, 5, 0], opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center"
        >
          <div className="h-5 w-0.5 bg-gradient-to-b from-brand-primary to-brand-primary/40 blur-[0.5px]" />
          <ChevronDown size={16} className="text-brand-primary -mt-0.5" />
        </motion.div>
      </div>
    );
  }
  return (
    <div className="flex justify-center py-1">
      <div className="h-5 w-0.5 rounded-full bg-canvas-border/70 border border-dashed border-canvas-border" />
    </div>
  );
}

interface WorkflowStepperProps {
  current: number;
  phase: StagePhase;
  loadingText: string;
}

export function WorkflowStepper({ current, phase, loadingText }: WorkflowStepperProps) {
  return (
    <div className="card glass rounded-2xl border border-canvas-border p-4">
      <div className="px-1 pb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-heading">Execution Pipeline</h3>
          <p className="text-[11px] text-text-muted">Each stage completes before the next begins</p>
        </div>
        {phase === 'running' && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 px-2.5 py-1 text-[11px] font-medium text-brand-primary">
            <Loader2 size={12} className="animate-spin" />
            Running
          </span>
        )}
      </div>

      <div className="space-y-0.5">
        {STAGES.map((stage, i) => {
          const status = statusOf(i, current, phase);
          const Icon = STAGE_ICONS[i] ?? FileText;
          const isCurrent = status === 'current';
          return (
            <div key={stage.id}>
              {i > 0 && <Connector prev={statusOf(i - 1, current, phase)} />}
              <div
                className={cn(
                  'flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition-all duration-300',
                  isCurrent
                    ? 'border-brand-primary/40 bg-brand-primary/5 shadow-glass'
                    : status === 'done'
                    ? 'border-canvas-border bg-canvas-surface/70'
                    : 'border-canvas-border/70 bg-canvas/40 opacity-80'
                )}
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                    status === 'done'
                      ? 'bg-success-100 text-success-700'
                      : isCurrent
                      ? 'bg-brand-primary/15 text-brand-primary'
                      : 'bg-canvas-surface text-text-muted'
                  )}
                >
                  {status === 'done' ? (
                    <Check size={17} />
                  ) : isCurrent ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Icon size={17} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      isCurrent ? 'text-brand-primary' : status === 'done' ? 'text-text-heading' : 'text-text-body'
                    )}
                  >
                    {stage.title}
                  </p>
                  <AnimatePresence mode="wait">
                    {isCurrent && phase === 'running' ? (
                      <motion.p
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-text-muted font-medium mt-0.5 flex items-center gap-1.5"
                      >
                        <span className="animate-pulse">{loadingText || 'Working…'}</span>
                        <span className="inline-flex gap-0.5">
                          <span className="w-1 h-1 rounded-full bg-brand-primary animate-bounce [animation-delay:0ms]" />
                          <span className="w-1 h-1 rounded-full bg-brand-primary animate-bounce [animation-delay:120ms]" />
                          <span className="w-1 h-1 rounded-full bg-brand-primary animate-bounce [animation-delay:240ms]" />
                        </span>
                      </motion.p>
                    ) : (
                      <motion.p
                        key="subtitle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-text-muted mt-0.5 truncate"
                      >
                        {stage.subtitle}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                {status !== 'current' && (
                  <span
                    className={cn(
                      'text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                      status === 'done'
                        ? 'text-success-600 border-success-200 bg-success-50'
                        : 'text-text-muted border-canvas-border bg-canvas-surface'
                    )}
                  >
                    {status === 'done' ? 'Complete' : `Stage ${i + 1}`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}