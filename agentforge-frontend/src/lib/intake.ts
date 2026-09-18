// src/lib/intake.ts
// Shared intake types + backend-row mappers for the AI Project Intake
// pipeline. NOTE (P0 stabilization): local AI heuristics were removed — the
// backend is the single source of truth and all stage data renders
// exclusively from backend endpoints.

// ─── Types ──────────────────────────────────────────────────────────

export type FeatPriority = 'low' | 'medium' | 'high' | 'critical';
export type DeptKey = 'frontend' | 'backend' | 'mobile' | 'ai' | 'devops' | 'qa';
export type StagePhase = 'idle' | 'running' | 'review' | 'done' | 'error';

export interface IntakeRequirement {
  id: string;
  title: string;
  description: string;
  priority: FeatPriority;
  tags: string[];
}

export interface IntakeFeature {
  id: string;
  title: string;
  description: string;
  priority: FeatPriority;
  complexity: 'low' | 'medium' | 'high';
  hours: number;
  dependencies: string[];
  tags: string[];
}

export interface IntakeTask {
  id: string;
  title: string;
  description: string;
  featureTitle: string;
  department: DeptKey;
  priority: FeatPriority;
  module: string;
  hours: number;
  skills: string[];
}

export interface IntakeSprint {
  id: string;
  name: string;
  goal: string;
  start_date: string;
  end_date: string;
  taskIds: string[];
  totalHours: number;
  completion: number;
  health: 'healthy' | 'at_risk' | 'delayed';
  blockers: string[];
}

export type MemberAvailability = 'available' | 'busy' | 'leave';

export interface IntakeMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  avatar_url?: string;
  github_username?: string;
  availability: MemberAvailability;
  member_type?: string;
  employment_id?: string;
}

export interface MemberMatch {
  memberId: string | null;
  score: number;
  reasons: string[];
}

export interface FeedItem {
  id: string;
  title: string;
  detail?: string;
  kind: 'info' | 'running' | 'success' | 'warning' | 'error';
  timestamp: number;
  /** Backend stage key (requirements/features/tasks/engineers/sprints/monitoring). */
  stage?: string | null;
  /** Rich AI-output payload for expandable cards (features/tasks/sprints/...). */
  data?: unknown;
}

// NOTE (P0 stabilization): frontend AI heuristics were removed. The backend
// is the single source of truth — all requirements/features/tasks/sprints
// render exclusively from backend endpoints. Local derivation helpers
// (detectDomains/parseRequirements/deriveFeatures/deriveTasks/planSprints/
// pickMember) were deleted so a deferred stage can never fake-complete.

// ─── Constants ──────────────────────────────────────────────────────

export const uid = () => Math.random().toString(36).slice(2, 10);

export const PRIORITY_META: Record<FeatPriority, { label: string; badge: string; dot: string; weight: number }> = {
  critical: { label: 'Critical', badge: 'bg-error-50 text-error-700 border-error-100', dot: 'bg-error-500', weight: 4 },
  high: { label: 'High', badge: 'bg-warning-50 text-warning-700 border-warning-100', dot: 'bg-warning-500', weight: 3 },
  medium: { label: 'Medium', badge: 'bg-info-50 text-info-700 border-info-100', dot: 'bg-info-500', weight: 2 },
  low: { label: 'Low', badge: 'bg-canvas-surface text-text-body border-canvas-border', dot: 'bg-gray-400', weight: 1 },
};

export interface DeptMeta {
  key: DeptKey;
  label: string;
  blurb: string;
  iconBg: string;
  iconText: string;
  chip: string;
  bar: string;
}

export const DEPARTMENTS: DeptMeta[] = [
  { key: 'frontend', label: 'Frontend', blurb: 'Web UI & interactions', iconBg: 'bg-sky-100', iconText: 'text-sky-600', chip: 'bg-sky-100 text-sky-700 border-sky-200', bar: 'bg-sky-500' },
  { key: 'backend', label: 'Backend', blurb: 'APIs, services & data', iconBg: 'bg-violet-100', iconText: 'text-violet-600', chip: 'bg-violet-100 text-violet-700 border-violet-200', bar: 'bg-violet-500' },
  { key: 'mobile', label: 'App Development', blurb: 'iOS & Android apps', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', chip: 'bg-emerald-100 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500' },
  { key: 'ai', label: 'AI / Machine Learning', blurb: 'Intelligent features', iconBg: 'bg-fuchsia-100', iconText: 'text-fuchsia-600', chip: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200', bar: 'bg-fuchsia-500' },
  { key: 'devops', label: 'DevOps', blurb: 'Infrastructure & release', iconBg: 'bg-amber-100', iconText: 'text-amber-600', chip: 'bg-amber-100 text-amber-700 border-amber-200', bar: 'bg-amber-500' },
  { key: 'qa', label: 'Quality Assurance', blurb: 'Testing & reliability', iconBg: 'bg-rose-100', iconText: 'text-rose-600', chip: 'bg-rose-100 text-rose-700 border-rose-200', bar: 'bg-rose-500' },
];

export const deptMeta = (key: DeptKey): DeptMeta => DEPARTMENTS.find((d) => d.key === key) ?? DEPARTMENTS[0];

export const STAGES: { id: number; title: string; subtitle: string }[] = [
  { id: 0, title: 'Requirements Analysis', subtitle: 'Extract and refine the product requirements' },
  { id: 1, title: 'Feature Extraction', subtitle: 'Break requirements into shippable features' },
  { id: 2, title: 'Task Segregation', subtitle: 'Split features into department tasks with deadlines' },
  { id: 3, title: 'AI Engineer Assignment', subtitle: 'Match the right engineer to every task' },
  { id: 4, title: 'Sprint Planning', subtitle: 'Plan sprints with deadlines and milestones' },
  { id: 5, title: 'Monitoring Summary', subtitle: 'Live command center — timeline, health, ownership' },
];

export const STAGE_LOADING_TEXTS: string[][] = [
  ['Reading document...', 'Identifying user stories...', 'Extracting requirements...', 'Finding dependencies...'],
  ['Analyzing requirements...', 'Mapping user stories to features...', 'Estimating complexity...', 'Defining acceptance criteria...'],
  ['Breaking down features into tasks...', 'Assigning departments...', 'Estimating effort...', 'Setting deadlines...'],
  ['Analyzing team skills...', 'Matching tasks to engineers...', 'Balancing workloads...', 'Finalizing assignments...'],
  ['Creating sprint backlogs...', 'Planning team capacity...', 'Setting sprint goals...', 'Computing critical path...'],
  ['Summarizing delivery health...', 'Building project timeline...', 'Checking model ownership...', 'Finalizing monitoring...'],
];

export const TASK_STATUS_COLORS: Record<string, string> = {
  todo: 'bg-canvas-surface text-text-muted border-canvas-border',
  queued: 'bg-info-50 text-info-700 border-info-100',
  in_progress: 'bg-warning-50 text-warning-700 border-warning-100',
  completed: 'bg-success-50 text-success-700 border-success-100',
  failed: 'bg-error-50 text-error-700 border-error-100',
  cancelled: 'bg-canvas-surface text-text-muted border-canvas-border',
};

// ─── Backend row mappers ────────────────────────────────────────────

/** Map one backend team/assignment member row to an IntakeMember view model. */
export function toMember(raw: unknown): IntakeMember {
  const m = (raw ?? {}) as Record<string, unknown>;
  const name = String(m.full_name ?? m.name ?? '');
  return {
    id: String(m.id ?? ''),
    full_name: name,
    email: String(m.email ?? ''),
    role: String(m.role ?? ''),
    department: String(m.department ?? ''),
    status: String(m.status ?? 'active'),
    avatar_url: m.avatar_url != null ? String(m.avatar_url) : undefined,
    github_username: m.github_username != null ? String(m.github_username) : undefined,
    availability: (['available', 'busy', 'leave'] as const).includes(m.availability as never)
      ? (m.availability as IntakeMember['availability'])
      : 'available',
    member_type: m.member_type != null ? String(m.member_type) : undefined,
    employment_id: m.employment_id != null ? String(m.employment_id) : undefined,
  };
}

// ─── Misc helpers ───────────────────────────────────────────────────

export const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function sourceKindFromFile(file: File | null): 'pdf' | 'docx' | 'txt' | 'markdown' {
  if (!file) return 'markdown';
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.docx')) return 'docx';
  if (name.endsWith('.txt')) return 'txt';
  return 'markdown';
}