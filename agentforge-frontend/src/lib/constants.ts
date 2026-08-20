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
export const STATUS_COLORS: Record<string, string> = {
  // Agent statuses
  active: 'bg-success-500/20 text-success-500 border-success-500/30',
  inactive: 'bg-base-700 text-base-400 border-base-600',

  // Task / execution statuses
  pending: 'bg-warning-500/20 text-warning-500 border-warning-500/30',
  running: 'bg-info-500/20 text-info-500 border-info-500/30',
  completed: 'bg-success-500/20 text-success-500 border-success-500/30',
  failed: 'bg-error-500/20 text-error-500 border-error-500/30',
  cancelled: 'bg-error-500/20 text-error-500 border-error-500/30',
  queued: 'bg-warning-500/20 text-warning-500 border-warning-500/30',

  // Generic variants used by Badge's `variant` prop
  default: 'bg-electric-500/20 text-electric-400 border-electric-500/30',
  success: 'bg-success-500/20 text-success-500 border-success-500/30',
  warning: 'bg-warning-500/20 text-warning-500 border-warning-500/30',
  error: 'bg-error-500/20 text-error-500 border-error-500/30',
  info: 'bg-info-500/20 text-info-500 border-info-500/30',
  neutral: 'bg-base-800 text-base-300 border-base-700',
};