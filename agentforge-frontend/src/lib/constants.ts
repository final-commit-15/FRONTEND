// src/lib/constants.ts

// ─── Agent Types ──────────────────────────────────────────────
export const AGENT_TYPES = [
  'coding',
  'automation',
  'data',
  'research',
] as const;

export type AgentType = (typeof AGENT_TYPES)[number];

// ─── Status arrays for filters & dropdowns ──────────────────
export const TASK_STATUSES = [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
] as const;

export const EXECUTION_STATUSES = [
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled',
] as const;

// ─── Color mapping for badges / status indicators ────────────
// Contrast-safe in both themes: tinted bg + strong text + matching border.
// Uses only tokens defined in tailwind.config.js / index.css.
export const STATUS_COLORS: Record<string, string> = {
  // Agent statuses
  active: 'bg-success-50 text-success-600 border-success-500/30',
  inactive: 'bg-canvas-surface text-text-muted border-canvas-border',

  // Task / execution statuses
  pending: 'bg-warning-50 text-warning-600 border-warning-500/30',
  running: 'bg-info-50 text-info-600 border-info-500/30',
  completed: 'bg-success-50 text-success-600 border-success-500/30',
  failed: 'bg-error-50 text-error-600 border-error-500/30',
  cancelled: 'bg-error-50 text-error-600 border-error-500/30',
  queued: 'bg-warning-50 text-warning-600 border-warning-500/30',

  // Generic variants used by Badge's `variant` prop
  default: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
  success: 'bg-success-50 text-success-600 border-success-500/30',
  warning: 'bg-warning-50 text-warning-600 border-warning-500/30',
  error: 'bg-error-50 text-error-600 border-error-500/30',
  info: 'bg-info-50 text-info-600 border-info-500/30',
  neutral: 'bg-canvas-surface text-text-body border-canvas-border',
};