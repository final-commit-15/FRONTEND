// src/components/auth/OtpSendSteps.tsx
// Agent Execution Feed — verification-code delivery steps. Streams the OTP
// send lifecycle (generate -> SMTP deliver -> ready) so the ui never presents
// a scheduled attempt as a delivered code; "sent" only renders when the
// backend confirmed SMTP acceptance (smtpAccepted === true).

import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import type { ReactNode } from 'react';
import {
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
  TerminalSquare,
  XCircle,
} from 'lucide-react';
import type { OtpSendResponse } from '@/types/api';
import { cn } from '@/lib/utils';

type SendState = 'idle' | 'pending' | 'success' | 'error';

interface FeedStep {
  key: string;
  label: string;
  detail?: string;
  state: 'active' | 'done' | 'failed' | 'waiting';
  icon: ReactNode;
}

export function OtpSendSteps({
  status,
  data,
  error,
}: {
  status: SendState;
  data?: OtpSendResponse | null;
  error?: unknown;
}) {
  if (status === 'idle') {
    return null;
  }

  const failed = status === 'error';
  const errorMessage =
    error instanceof Error ? error.message : undefined;

  const steps: FeedStep[] = [
    {
      key: 'generate',
      label: 'Generate verification code',
      detail:
        status === 'pending'
          ? 'Rolling a secure random code…'
          : data?.otpLength
            ? `${data.otpLength}-digit one-time code`
            : '8-digit one-time code',
      state:
        status === 'pending'
          ? 'active'
          : status === 'success' || status === 'error'
            ? 'done'
            : 'waiting',
      icon: <ShieldCheck size={13} />,
    },
    {
      key: 'smtp',
      label: 'Deliver verification email (SMTP)',
      detail: failed
        ? errorMessage ?? 'SMTP did not accept the message.'
        : status === 'pending'
          ? 'Connecting and authenticating, then sending…'
          : status === 'success'
            ? data?.smtpAccepted
              ? 'SMTP accepted the message. Delivery confirmed.'
              : 'Delivered.'
            : 'Awaiting send…',
      state: failed
        ? 'failed'
        : status === 'pending'
          ? 'active'
          : status === 'success'
            ? 'done'
            : 'waiting',
      icon: <Mail size={13} />,
    },
    {
      key: 'ready',
      label: 'Verification code ready',
      detail:
        status === 'success'
          ? data?.expiresIn
            ? `Valid for ${Math.round(data.expiresIn / 60)} min${data.resendAfter ? ` · resend in ${data.resendAfter}s` : ''}`
            : 'Code valid until expiry.'
          : failed
            ? 'Skipped — no code was stored for this attempt.'
            : 'Waiting for delivery…',
      state: status === 'success' ? 'done' : 'waiting',
      icon: <CheckCircle2 size={13} />,
    },
  ];

  return (
    <div className="card glass rounded-2xl border border-canvas-border overflow-hidden">
      <div className="px-4 py-3 border-b border-canvas-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-primary/10 flex items-center justify-center">
            <TerminalSquare size={14} className="text-brand-primary" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-text-heading">
              Agent Execution Feed
            </h4>
            <p className="text-[10px] text-text-muted">
              Verification-code delivery
            </p>
          </div>
        </div>
        {status === 'pending' ? (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-warning-500">
            <span className="w-1.5 h-1.5 rounded-full bg-warning-500 animate-pulse" />
            Running
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-success-600">
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                failed ? 'bg-error-500' : 'bg-success-500'
              )}
            />
            {failed ? 'Failed' : 'Complete'}
          </span>
        )}
      </div>

      <div className="px-4 py-3 space-y-1.5">
        <AnimatePresence initial={false}>
          {steps.map((step) => (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18 }}
              className={cn(
                'flex items-start gap-2.5 rounded-lg px-2.5 py-2',
                step.state === 'failed'
                  ? 'bg-error-50/60'
                  : step.state === 'done'
                    ? 'bg-success-50/40'
                    : 'bg-canvas-surface/40'
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                  step.state === 'active' && 'text-brand-primary',
                  step.state === 'done' && 'text-success-600',
                  step.state === 'failed' && 'text-error-600'
                )}
              >
                {step.state === 'active' ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : step.state === 'failed' ? (
                  <XCircle size={13} />
                ) : step.state === 'done' ? (
                  step.icon
                ) : (
                  <span className="block h-1.5 w-1.5 rounded-full bg-canvas-border" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block text-xs font-medium',
                    step.state === 'done'
                      ? 'text-text-heading'
                      : step.state === 'waiting'
                        ? 'text-text-muted'
                        : 'text-text-body'
                  )}
                >
                  {step.label}
                </span>
                {step.detail && (
                  <span className="block text-[11px] text-text-muted mt-0.5">
                    {step.detail}
                  </span>
                )}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {status === 'success' && (
          <p className="pt-1.5 text-[10px] text-text-muted font-mono text-right">
            {data?.expiresIn ? `OtpSendResponse → sent ${format(new Date(), 'HH:mm:ss')}` : ''}
          </p>
        )}
      </div>
    </div>
  );
}