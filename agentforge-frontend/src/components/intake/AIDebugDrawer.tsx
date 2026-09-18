// src/components/intake/AIDebugDrawer.tsx
// Expandable AI Debug Drawer (P0 BUG 9): request / response / error sections
// for a single AI execution log entry. Copy buttons + Download JSON.

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bug, X, Copy, Download } from 'lucide-react';
import type { AIExecLog } from '@/hooks/useIntakePipeline';
import { cn } from '@/lib/utils';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-canvas-border bg-canvas-surface/50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5">{title}</p>
      <div className="text-xs text-text-body space-y-1">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <p className="flex gap-2">
      <span className="text-text-muted shrink-0 w-28">{k}</span>
      <span className="min-w-0 flex-1 break-words font-mono">{v}</span>
    </p>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };
  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded border transition-colors',
        copied ? 'text-emerald-600 border-emerald-300 bg-emerald-50' : 'text-brand-primary hover:text-brand-primary-dark border-transparent'
      )}
      aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
    >
      <Copy size={12} />
      {copied ? 'Copied!' : `Copy ${label}`}
    </button>
  );
}

export function AIDebugDrawer({ log, onClose }: { log: AIExecLog | null; onClose: () => void }) {
  const [showRaw, setShowRaw] = useState(false);

  const fullJson = log ? JSON.stringify(log, null, 2) : '';

  const handleDownloadJson = () => {
    if (!log) return;
    const blob = new Blob([fullJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-exec-${log.id.slice(0, 8)}-${log.stage}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {log && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[420px] z-50 bg-canvas border-l border-canvas-border shadow-2xl flex flex-col"
          >
            <div className="px-5 py-4 border-b border-canvas-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug size={16} className="text-brand-primary" />
                <h3 className="text-sm font-bold text-text-heading">AI Debug Drawer</h3>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-canvas-surface text-text-muted" aria-label="Close debug drawer">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <Section title="Request">
                <Row k="Execution ID" v={log.id} />
                <Row k="Created At" v={new Date(log.createdAt).toLocaleString()} />
                <Row k="Stage" v={log.stage} />
                <Row k="Model" v={log.actualModel || log.requestedModel || '—'} />
                <Row k="Requested" v={log.requestedModel || '—'} />
                <Row k="Provider" v={log.provider} />
                <Row k="Prompt size" v={`${log.promptSize.toLocaleString()} chars`} />
                <div className="flex gap-2">
                  <div className="flex-1 rounded-lg bg-canvas p-2 max-h-48 overflow-y-auto whitespace-pre-wrap break-words">
                    {log.prompt || '(prompt not stored)'}
                  </div>
                  <CopyButton text={log.prompt || ''} label="Prompt" />
                </div>
              </Section>

              <Section title="Response">
                <Row k="Latency" v={`${log.latencyMs} ms`} />
                <Row k="Tokens" v={`${log.tokensUsed}`} />
                <Row k="Output size" v={`${log.outputSize} chars`} />
                <Row k="Retries" v={`${log.retryCount}`} />
                {log.response ? (
                  <>
                    <div className="flex gap-2">
                      <div className="flex-1 rounded-lg bg-canvas p-2 max-h-64 overflow-y-auto whitespace-pre-wrap break-words">
                        {showRaw ? log.response : log.response.slice(0, 2000)}
                        {!showRaw && log.response.length > 2000 ? '…' : ''}
                      </div>
                      <CopyButton text={log.response} label="Response" />
                    </div>
                    {log.response.length > 2000 && (
                      <button
                        className={cn('text-[11px] font-semibold text-brand-primary hover:underline')}
                        onClick={() => setShowRaw((s) => !s)}
                      >
                        {showRaw ? 'Show less' : 'Show full raw response'}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-text-muted">(no response — call failed or was deferred)</p>
                )}
              </Section>

              <Section title="Error / Takeover">
                <Row k="HTTP / status" v={log.errorType || 'OK'} />
                <Row k="Provider error" v={log.errorMessage || '—'} />
                <Row k="Retry count" v={`${log.retryCount}`} />
                <Row k="Takeover" v={log.actualModel && log.requestedModel && log.actualModel !== log.requestedModel ? `${log.requestedModel} → ${log.actualModel}` : 'none'} />
              </Section>

              <Section title="Actions">
                <div className="flex gap-2">
                  <CopyButton text={fullJson} label="Full JSON" />
                  <button
                    onClick={handleDownloadJson}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-1 rounded border border-canvas-border text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/5 transition-colors"
                  >
                    <Download size={12} />
                    Download JSON
                  </button>
                </div>
              </Section>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
