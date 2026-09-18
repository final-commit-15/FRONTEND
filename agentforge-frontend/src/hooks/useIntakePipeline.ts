// src/hooks/useIntakePipeline.ts
// Backend-driven 6-stage AI Project Intake observer.
//
// The backend owns the workflow (single source of truth). This hook NEVER
// fabricates stage results: every requirement/feature/task/assignment/sprint
// shown here is loaded from backend endpoints after the backend marks the
// stage COMPLETED. A DEFERRED/FAILED stage freezes the UI in place — later
// stages are never marked complete locally.
//
// A SINGLE polling subscription per job drives monitoring + activity +
// execution logs. Polling runs only while the pipeline is active
// (running/deferred) and stops on completed/failed/cancelled. Session state
// persists across navigation/refresh via localStorage + ?jobId= deep links.

import { useCallback, useEffect, useRef, useState } from 'react';
import { requirementsApi } from '@/api/requirements';
import { apiClient, getApiErrorMessage } from '@/api/client';
import { useSprintStore } from '@/store/sprintStore';
import {
  FeedItem,
  IntakeFeature,
  IntakeMember,
  IntakeRequirement,
  IntakeSprint,
  IntakeTask,
  MemberMatch,
  sourceKindFromFile,
  StagePhase,
  STAGE_LOADING_TEXTS,
  toMember,
  uid,
} from '@/lib/intake';

export interface IntakeStartInput {
  projectName: string;
  description: string;
  sourceText: string;
  file?: File | null;
  // Client information captured at creation — persisted to Projects.
  clientName?: string;
  clientEmail?: string;
  company?: string;
  projectPriority?: string;
  expectedDeliveryDate?: string;
  teamMembers?: string[];
  // Provider selection at execute time — sent in the /execute payload so the
  // pipeline runs on the chosen provider (owner hint for stage 0).
  provider?: string;
  model?: string;
}

export interface PipelineMonitoringStage {
  key: string;
  label: string;
  status: string;
  masterStatus?: string;
  model?: string | null;
  requestedModel?: string | null;
  actualModel?: string | null;
  provider?: string | null;
  pipelineOwner?: string | null;
  switchReason?: string | null;
  refreshAt?: string | null;
  retryAfterSeconds?: number | null;
  friendlyMessage?: string | null;
  canonicalPool?: string[] | null;
  duration_ms?: number;
  latencyMs?: number;
  attempts?: number;
  retryCount?: number;
  startTime?: string | null;
  completionTime?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  error?: string | null;
  // FIX 6 retry metadata persisted by the backend retry queue (countdown
  // fields exposed on the stage row so the frontend can show "Retrying in X").
  retryAttemptCount?: number | null;
  backoffSeconds?: number | null;
  nextRetryAt?: string | null;
  maxRetries?: number | null;
}

export interface PipelineMonitoring {
  requirementId?: string;
  status: string;
  pipelineStatus?: string;
  cancelled?: boolean;
  currentStage?: string;
  model?: string;
  pipelineOwner?: string;
  provider?: string;
  progress: number;
  taskCount: number;
  sprintCount: number;
  retries: number;
  stages: PipelineMonitoringStage[];
  modelStates?: Array<Record<string, unknown>>;
  // BUG 11: backend-authoritative pause banner + refresh window (never omitted
  // while the pipeline is blocked waiting for a model).
  blockingReason?: string | null;
  currentBlockedStage?: string | null;
  refreshAt?: string | null;
  retryAfterSeconds?: number | null;
  retryAttemptCount?: number | null;
  maxRetries?: number | null;
}

export interface AIExecLog {
  id: string;
  stage: string;
  provider: string;
  requestedModel?: string | null;
  actualModel?: string | null;
  prompt: string;
  promptSize: number;
  response: string;
  latencyMs: number;
  tokensUsed: number;
  outputSize: number;
  retryCount: number;
  errorType?: string | null;
  errorMessage?: string | null;
  createdAt: string;
}

export interface ModelOwnershipRow {
  model: string;
  status: string;
  owner: boolean;
  cooldown: string;
  retryable?: boolean;
  apiSupported?: boolean;
  sessionOnly?: boolean;
  rawStatus?: string;
  retryAfterSeconds?: number;
  refreshAt?: string | null;
  reason?: string | null;
}

// Backend stage keys (monitor) and the API stage names accepted by
// POST /requirements/{id}/next-stage and /retry-stage.
const PIPELINE_STAGE_KEYS = ['requirements', 'features', 'tasks', 'engineers', 'sprints', 'monitoring'];
const API_STAGE_NAMES = [
  'requirements_analysis',
  'feature_extraction',
  'task_segregation',
  'engineer_assignment',
  'sprint_planning',
  'monitoring_summary',
];
const TOTAL_STAGES = 6;

const TERMINAL_STAGES = new Set(['completed', 'success', 'deferred', 'failed', 'error']);
// Deferred is NOT terminal for polling: the backend auto-resumes deferred
// stages within seconds, so we keep observing until it completes.
const POLL_INTERVAL_MS = 2500;
const STAGE_WAIT_TIMEOUT_MS = 15 * 60 * 1000;

const PRIO = (v: unknown): IntakeRequirement['priority'] => {
  const s = String(v ?? '').toLowerCase();
  return (['low', 'medium', 'high', 'critical'] as const).includes(s as never) ? (s as IntakeRequirement['priority']) : 'medium';
};

const DPT_KEY = (v: unknown): IntakeTask['department'] => {
  const s = String(v ?? '').toLowerCase();
  return (['frontend', 'backend', 'mobile', 'ai', 'devops', 'qa'] as const).includes(s as never)
    ? (s as IntakeTask['department'])
    : 'backend';
};

const TASK_PRIO = (v: unknown): IntakeTask['priority'] => {
  const s = String(v ?? '').toLowerCase();
  if (s === 'urgent' || s === 'critical') return 'high';
  return PRIO(s);
};

// Pure mappers: backend persisted rows -> intake view models.
const mapBackendFeatures = (rawFeatures: unknown[]): IntakeFeature[] =>
  rawFeatures
    .filter((f: unknown) => f && (f as { title?: unknown }).title)
    .map((raw) => {
      const f = raw as { title: unknown; description?: unknown; priority?: unknown; estimated_complexity?: unknown; estimated_story_points?: unknown };
      const complexity = String(f.estimated_complexity ?? 'medium').toLowerCase();
      const hoursNum = Number(f.estimated_story_points ?? 0);
      return {
        id: uid(),
        title: String(f.title ?? '').slice(0, 300),
        description: String(f.description ?? ''),
        priority: PRIO(f.priority),
        complexity: (['low', 'medium', 'high'] as const).includes(complexity as never) ? (complexity as IntakeFeature['complexity']) : 'medium',
        hours: hoursNum > 0 ? hoursNum : 12,
        dependencies: [],
        tags: [],
      };
    });

const mapBackendTasks = (rawTasks: unknown[]): IntakeTask[] =>
  rawTasks
    .filter((t: unknown) => t && (t as { title?: unknown }).title)
    .map((raw) => {
      const t = raw as { title: unknown; description?: unknown; department?: unknown; module?: unknown; hours?: unknown; estimated_hours?: unknown; priority?: unknown; skills?: unknown; feature_title?: unknown; estimated_deadline?: unknown; deadline?: unknown; sprint?: unknown };
      return {
        id: uid(),
        title: String(t.title ?? '').slice(0, 300),
        description: String(t.description ?? ''),
        featureTitle: String(t.feature_title ?? ''),
        department: DPT_KEY(t.department),
        priority: TASK_PRIO(t.priority),
        module: String(t.module ?? ''),
        hours: Number(t.estimated_hours ?? t.hours ?? 8),
        skills: Array.isArray(t.skills) ? t.skills.map((s) => String(s)) : [],
        deadline: String(t.estimated_deadline ?? t.deadline ?? ''),
        sprint: String(t.sprint ?? ''),
      } as IntakeTask;
    });

// ─── Persistent pipeline session (survives nav/refresh/tab close) ────
const SESSION_KEY = 'agentforge.pipeline.active';
interface PersistedSession {
  jobId: string;
  requirementId: string;
  input: IntakeStartInput;
  startedAt: number;
}

const loadSession = (): PersistedSession | null => {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSession;
    if (!parsed?.jobId) return null;
    return parsed;
  } catch {
    return null;
  }
};

const saveSession = (s: PersistedSession) => {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable — session simply won't survive refresh */
  }
};

const clearSession = () => {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
};

interface StageWait {
  outcome: 'ready' | 'degraded';
  stageStatus: string;
  snapshot: Record<string, unknown> | null;
}

export function useIntakePipeline() {
  const [started, setStarted] = useState(false);
  const [jobId, setJobId] = useState<string | undefined>(undefined);
  const [stage, setStage] = useState(-1);
  const [phase, setPhase] = useState<StagePhase>('idle');
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState('');

  const [requirements, setRequirementsState] = useState<IntakeRequirement[]>([]);
  const [features, setFeaturesState] = useState<IntakeFeature[]>([]);
  const [tasks, setTasksState] = useState<IntakeTask[]>([]);
  const [members, setMembersState] = useState<IntakeMember[]>([]);
  const [assignments, setAssignmentsState] = useState<Record<string, string>>({});
  const [matches, setMatches] = useState<Record<string, MemberMatch>>({});
  const [sprints, setSprintsState] = useState<IntakeSprint[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [persistedSprints, setPersistedSprints] = useState<{ id: string; name: string; status: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [activityFeed, setActivityFeed] = useState<FeedItem[]>([]);
  const [execLogs, setExecLogs] = useState<AIExecLog[]>([]);
  const [monitoring, setMonitoring] = useState<PipelineMonitoring>({
    status: 'idle',
    progress: 0,
    taskCount: 0,
    sprintCount: 0,
    retries: 0,
    stages: [],
    blockingReason: null,
    currentBlockedStage: null,
    refreshAt: null,
    retryAfterSeconds: 0,
    retryAttemptCount: 0,
    maxRetries: 0,
  });
  // FIX 10: live countdown while the pipeline is paused on a deferred stage.
  // When a stage reports nextRetryAt, polling PAUSES (no infinite 2.5s loop)
  // and a single timer resumes it exactly when the backend retry queue wakes.
  const [deferredPaused, setDeferredPaused] = useState(false);
  const [deferredCountdown, setDeferredCountdown] = useState(0);
  const resumeTimerRef = useRef<number | null>(null);
  // Refs to break the render-cycle between tick/ensurePolling/scheduleResume.
  const tickRef = useRef<(id: string) => Promise<void>>(async () => {});
  const ensurePollingRef = useRef<(id: string) => void>(() => {});

  const startedRef = useRef(false);
  const inputRef = useRef<IntakeStartInput | null>(null);
  const requirementIdRef = useRef<string | undefined>(undefined);
  const jobIdRef = useRef<string | undefined>(undefined);
  const stageRef = useRef(-1);
  const runningRef = useRef(false);
  const monitoringRef = useRef<PipelineMonitoring | null>(null);

  // Single-subscription polling state: at most ONE interval per job.
  const pollRef = useRef<{ jobId: string | null; timer: number | null }>({ jobId: null, timer: null });
  const waitersRef = useRef<Array<{ id: number; key: string; resolve: (v: StageWait) => void }>>([]);
  const waiterSeq = useRef(0);

  const setRequirements = (v: IntakeRequirement[]) => setRequirementsState(v);
  const setFeatures = (v: IntakeFeature[]) => setFeaturesState(v);
  const setTasks = (v: IntakeTask[]) => setTasksState(v);
  const setAssignments = (v: Record<string, string>) => setAssignmentsState(v);
  const setMembers = (v: IntakeMember[]) => setMembersState(v);
  const setSprints = (v: IntakeSprint[]) => setSprintsState(v);

  const pushFeed = (title: string, detail: string, kind: FeedItem['kind']) => {
    setFeed((prev) => [...prev, { id: uid(), title, detail, kind, timestamp: Date.now() }].slice(-40));
  };

  // P0: normalize backend stage statuses to the canonical finite set
  // (pending | running | completed | blocked | failed). Backend is the only
  // source of truth — the UI never infers completion from anything else.
  const normalizeStageStatus = (raw: unknown): string => {
    const s = String(raw ?? 'pending').toLowerCase();
    if (s === 'success') return 'completed';
    if (s === 'error') return 'failed';
    if (['pending', 'running', 'completed', 'blocked', 'failed', 'deferred'].includes(s)) return s;
    return 'pending';
  };

  const applyMonitorSnapshot = (snap: Record<string, unknown>) => {
    const rawStages = Array.isArray(snap.stages) ? (snap.stages as Array<Record<string, unknown>>) : null;
    const stages = rawStages
      ? (rawStages.map((s) => ({ ...s, status: normalizeStageStatus(s.status) })) as unknown as PipelineMonitoringStage[])
      : undefined;
    setMonitoring((m) => {
      const next: PipelineMonitoring = {
        ...m,
        requirementId: requirementIdRef.current,
        status: String(snap.status ?? m.status),
        pipelineStatus: (snap.pipelineStatus as string) ?? m.pipelineStatus,
        cancelled: Boolean(snap.cancelled ?? m.cancelled ?? false),
        currentStage: (snap.current_stage as string) ?? m.currentStage,
        model: (snap.model_in_use as string) ?? m.model,
        pipelineOwner: (snap.pipelineOwner as string) ?? m.pipelineOwner,
        provider: (snap.provider as string) ?? m.provider ?? 'multi-provider',
        progress: Number(snap.progress ?? m.progress),
        taskCount: Number(snap.task_count ?? m.taskCount),
        sprintCount: Number(snap.sprint_count ?? m.sprintCount),
        retries: Number(snap.retries ?? m.retries),
        stages: (stages ?? m.stages) as unknown as PipelineMonitoringStage[],
        modelStates: (Array.isArray(snap.model_states) ? snap.model_states : m.modelStates) ?? [],
        // BUG 11: backend-authoritative pause banner + refresh window.
        blockingReason: (snap.blockingReason as string) ?? m.blockingReason ?? null,
        currentBlockedStage: (snap.currentBlockedStage as string) ?? m.currentBlockedStage ?? null,
        refreshAt: (snap.refreshAt as string) ?? m.refreshAt ?? null,
        retryAfterSeconds: Number(snap.retryAfterSeconds ?? m.retryAfterSeconds ?? 0),
        retryAttemptCount: Number(snap.retryAttemptCount ?? m.retryAttemptCount ?? 0),
        maxRetries: Number(snap.maxRetries ?? m.maxRetries ?? 0),
      };
      monitoringRef.current = next;
      return next;
    });
  };

  const isTerminalSnapshot = (snap: Record<string, unknown>): boolean => {
    const ps = String(snap.pipelineStatus ?? snap.status ?? '');
    return ['completed', 'failed', 'cancelled'].includes(ps);
  };

  const resolveWaiters = (snap: Record<string, unknown>) => {
    const stages = Array.isArray(snap.stages) ? (snap.stages as Array<Record<string, unknown>>) : [];
    const pending = waitersRef.current;
    waitersRef.current = [];
    for (const w of pending) {
      const st = stages.find((s) => s.key === w.key);
      const rawStatus = String(st?.status ?? '');
      // Normalize to the canonical backend set (pending/running/completed/
      // blocked/failed); never infer completion from anything else.
      const stageStatus = rawStatus === 'success' ? 'completed' : rawStatus === 'error' ? 'failed' : rawStatus;
      if (TERMINAL_STAGES.has(stageStatus) || stageStatus === 'completed' || stageStatus === 'failed') {
        w.resolve({
          outcome: stageStatus === 'completed' ? 'ready' : 'degraded',
          stageStatus,
          snapshot: snap,
        });
      } else {
        // Not terminal yet — keep waiting.
        waitersRef.current.push(w);
      }
    }
  };

  const failAllWaiters = () => {
    const pending = waitersRef.current;
    waitersRef.current = [];
    for (const w of pending) {
      w.resolve({ outcome: 'degraded', stageStatus: 'unknown', snapshot: null });
    }
  };

  const fetchSnapshot = async (id: string): Promise<Record<string, unknown> | null> => {
    try {
      const res = await apiClient.get<Record<string, unknown>>(`/monitoring/${id}`);
      return res.data;
    } catch {
      return null;
    }
  };

  const fetchActivity = async (id: string) => {
    try {
      const res = await apiClient.get<{
        events?: Array<{ id: string; event: string; title: string; detail?: string; kind?: string; stage?: string | null; data?: unknown; preview?: string; created_at?: string }>;
      }>(`/intelligence/activity/${id}`);
      const events = Array.isArray(res.data?.events) ? res.data.events : [];
      setActivityFeed(
        events.map((e) => ({
          id: String(e.id),
          title: String(e.title ?? e.event),
          detail: e.detail ?? e.preview ?? '',
          kind: (['info', 'running', 'success', 'warning', 'error'] as const).includes((e.kind ?? '') as never)
            ? (e.kind as FeedItem['kind'])
            : 'info',
          timestamp: e.created_at ? Date.parse(e.created_at) : Date.now(),
          stage: e.stage ?? null,
          data: e.data,
        }))
      );
    } catch {
      /* activity poll failure is tolerated — last feed stays */
    }
  };

  const fetchExecLogs = async (id: string) => {
    try {
      const res = await apiClient.get<{ logs?: AIExecLog[] }>(`/intelligence/logs/${id}`);
      if (Array.isArray(res.data?.logs)) setExecLogs(res.data.logs);
    } catch {
      /* tolerated */
    }
  };

  // ─── THE single polling subscription ─────────────────────────────
  // Polls monitoring + activity + exec logs on one interval. Runs only
  // while the pipeline is active; stops itself on terminal states.
  const stopPolling = useCallback(() => {
    if (pollRef.current.timer) window.clearInterval(pollRef.current.timer);
    pollRef.current = { jobId: null, timer: null };
    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  // FIX 10: when the backend pauses a stage (deferred), stop the 2.5s poll
  // loop and schedule a single wake-up exactly at nextRetryAt. This prevents
  // an infinite deferred loop hammering /monitoring while nothing is running.
  const scheduleDeferredResume = useCallback(
    (id: string, snap: Record<string, unknown>) => {
      const stages = Array.isArray(snap.stages) ? (snap.stages as Array<Record<string, unknown>>) : [];
      const deferredStage = stages.find((s) => s.status === 'deferred');
      const nextAt = String(deferredStage?.nextRetryAt ?? '');
      const delayMs = nextAt ? Math.max(0, Date.parse(nextAt) - Date.now()) : 0;
      if (delayMs > 2500) {
        // Far enough in the future: stop the loop, schedule one wake-up,
        // and show a live countdown.
        stopPolling();
        setDeferredPaused(true);
        setDeferredCountdown(Math.ceil(delayMs / 1000));
        resumeTimerRef.current = window.setTimeout(() => {
          resumeTimerRef.current = null;
          setDeferredPaused(false);
          setDeferredCountdown(0);
          if (pollRef.current.jobId === null && jobIdRef.current === id) {
            ensurePollingRef.current(id);
          }
        }, delayMs);
        return;
      }
      // Soon or no timestamp: keep the normal poll loop (bounded by the
      // backend's max-retry FAIL transition, never infinite).
      setDeferredPaused(false);
      setDeferredCountdown(0);
    },
    [stopPolling]
  );

  const tick = useCallback(
    async (id: string) => {
      const snap = await fetchSnapshot(id);
      if (snap) {
        applyMonitorSnapshot(snap);
        resolveWaiters(snap);
        if (isTerminalSnapshot(snap)) {
          // Final refresh of feed + logs, then stop forever.
          await fetchActivity(id);
          await fetchExecLogs(id);
          setDeferredPaused(false);
          setDeferredCountdown(0);
          stopPolling();
          return;
        }
        const paused = Array.isArray(snap.stages) && snap.stages.some((s: unknown) => (s as { status?: string }).status === 'deferred');
        if (paused) {
          scheduleDeferredResume(id, snap);
        } else {
          setDeferredPaused(false);
          setDeferredCountdown(0);
        }
      }
      await fetchActivity(id);
      await fetchExecLogs(id);
    },
    [stopPolling, scheduleDeferredResume]
  ); // eslint-disable-line react-hooks/exhaustive-deps
  tickRef.current = tick;

  const ensurePolling = useCallback(
    (id: string) => {
      if (pollRef.current.jobId === id && pollRef.current.timer) return; // already the one loop
      stopPolling();
      if (resumeTimerRef.current) {
        window.clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
      pollRef.current = { jobId: id, timer: null };
      void tickRef.current(id);
      if (resumeTimerRef.current) return; // tick already scheduled a deferred wake-up
      pollRef.current.timer = window.setInterval(() => void tickRef.current(id), POLL_INTERVAL_MS);
    },
    [stopPolling]
  );
  ensurePollingRef.current = ensurePolling;

  // FIX 10: when paused on a deferred stage, decrement the countdown every
  // second; at zero, resume polling so the backend's refreshed model is picked
  // up immediately.
  useEffect(() => {
    if (!deferredPaused || !jobIdRef.current) return;
    const interval = window.setInterval(() => {
      setDeferredCountdown((cd) => {
        if (cd <= 1) {
          window.clearInterval(interval);
          setDeferredPaused(false);
          if (jobIdRef.current) ensurePollingRef.current(jobIdRef.current);
          return 0;
        }
        return cd - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredPaused]);

  const waitForStage = (idx: number): Promise<StageWait> =>
    new Promise<StageWait>((resolve) => {
      const id = waiterSeq.current++;
      waitersRef.current.push({ id, key: PIPELINE_STAGE_KEYS[idx], resolve });
      window.setTimeout(() => {
        const at = waitersRef.current.findIndex((w) => w.id === id);
        if (at >= 0) {
          const [w] = waitersRef.current.splice(at, 1);
          w.resolve({ outcome: 'degraded', stageStatus: 'timeout', snapshot: null });
        }
      }, STAGE_WAIT_TIMEOUT_MS);
    });

  // ─── Backend-only stage data loaders (no heuristics, ever) ───────
  const loadRequirementAnalysis = async (id: string): Promise<boolean> => {
    const req = await apiClient
      .get<{ ai_extracted_features?: unknown[]; ai_summary?: string }>(`/requirements/${id}`)
      .catch(() => null);
    const aiReqs = Array.isArray(req?.data?.ai_extracted_features)
      ? req!.data!.ai_extracted_features!.filter((r: unknown) => r && (r as { title?: unknown }).title)
      : [];
    if (aiReqs.length > 0) {
      setRequirements(
        aiReqs.map((raw) => {
          const r = raw as { title?: unknown; description?: unknown; priority?: unknown };
          return {
            id: uid(),
            title: String(r.title ?? '').slice(0, 300),
            description: String(r.description ?? ''),
            priority: PRIO(r.priority),
            tags: [],
          };
        })
      );
      return true;
    }
    setRequirements([]);
    return false;
  };

  const loadFeatures = async (id: string): Promise<boolean> => {
    const resp = await apiClient
      .get<Record<string, unknown>>(`/requirements/${id}/features`)
      .catch(() => null);
    const raw = Array.isArray(resp?.data?.features) ? (resp!.data!.features as unknown[]) : [];
    if (raw.length === 0) {
      setFeatures([]);
      return false;
    }
    setFeatures(mapBackendFeatures(raw));
    pushFeed('Features extracted', `Backend returned ${raw.length} AI-generated features.`, 'success');
    return true;
  };

  const loadTasks = async (id: string): Promise<boolean> => {
    const resp = await apiClient
      .get<Record<string, unknown>>(`/requirements/${id}/tasks`)
      .catch(() => null);
    const raw = Array.isArray(resp?.data?.tasks) ? (resp!.data!.tasks as unknown[]) : [];
    if (raw.length === 0) {
      setTasks([]);
      return false;
    }
    const mapped = mapBackendTasks(raw);
    setTasks(mapped);
    setMonitoring((m) => ({ ...m, taskCount: mapped.length }));
    pushFeed('Tasks generated', `Backend returned ${mapped.length} AI-generated tasks with deadlines.`, 'success');
    return true;
  };

  const loadAssignments = async (id: string): Promise<boolean> => {
    const resp = await apiClient
      .get<Record<string, unknown>>(`/requirements/${id}/assignments`)
      .catch(() => null);
    const team = Array.isArray(resp?.data?.team) ? (resp!.data!.team as unknown[]) : [];
    const list = Array.isArray(resp?.data?.assignments) ? (resp!.data!.assignments as unknown[]) : [];
    // Backend truth only: empty team stays empty (invite members instead of faking).
    setMembers(team.map((m: unknown) => toMember(m)));
    const mapping: Record<string, string> = {};
    const matchMap: Record<string, MemberMatch> = {};
    for (const a of list) {
      const item = a as { task_id?: unknown; member_id?: unknown; reasons?: unknown; applied?: unknown; suggested?: unknown };
      if (!item.task_id) continue;
      mapping[String(item.task_id)] = String(item.member_id ?? '');
      matchMap[String(item.task_id)] = {
        memberId: item.member_id ? String(item.member_id) : null,
        score: item.applied || item.suggested ? 100 : 0,
        reasons: Array.isArray(item.reasons) ? item.reasons.map((r) => String(r)) : ['AI suggestion'],
      };
    }
    setAssignments(mapping);
    setMatches(matchMap);
    const assigned = Object.values(mapping).filter(Boolean).length;
    pushFeed(
      'AI assignments suggested',
      assigned ? `Backend assigned engineers to ${assigned} tasks.` : 'No engineers assigned yet — invite your team, then retry.',
      assigned ? 'success' : 'warning'
    );
    return list.length > 0 || team.length > 0;
  };

  const applyBackendSprints = (raw: Array<Record<string, unknown>>): boolean => {
    if (raw.length === 0) return false;
    const planned: IntakeSprint[] = raw.map((s) => ({
      id: String(s.id ?? uid()),
      name: String(s.name ?? 'Sprint'),
      goal: String(s.goal ?? ''),
      start_date: String(s.start_date ?? ''),
      end_date: String(s.end_date ?? ''),
      taskIds: Array.isArray(s.task_ids) ? s.task_ids.map((t) => String(t)) : [],
      totalHours: Number(s.story_points_planned ?? 0) * 4,
      completion: 0,
      health: 'healthy' as IntakeSprint['health'],
      blockers: [],
    }));
    const storeSprints = planned.map((s, i) => ({
      id: s.id,
      name: s.name,
      status: i === 0 ? 'active' : 'planned',
    }));
    useSprintStore.getState().setSprints(storeSprints);
    useSprintStore.getState().setActiveSprintId(storeSprints[0]?.id);
    setSprints(planned);
    setPersistedSprints(storeSprints);
    setMonitoring((m) => ({ ...m, sprintCount: planned.length }));
    pushFeed('Sprints created', `${planned.length} AI-planned sprints synced to the Sprint Journal.`, 'success');
    return true;
  };

  const loadSprints = async (id: string): Promise<boolean> => {
    const resp = await apiClient
      .get<Record<string, unknown>>(`/requirements/${id}/sprints`)
      .catch(() => null);
    const raw = Array.isArray(resp?.data?.sprints)
      ? (resp!.data!.sprints as Array<Record<string, unknown>>)
      : [];
    return applyBackendSprints(raw);
  };

  const STAGE_LOADERS: Array<(id: string) => Promise<boolean>> = [
    loadRequirementAnalysis,
    loadFeatures,
    loadTasks,
    loadAssignments,
    loadSprints,
    async () => true, // monitoring: nothing to load; summary streams via feed/logs
  ];

  // Observational chain: wait for each backend stage to go terminal, load its
  // backend data, and advance ONLY on COMPLETED. DEFERRED/FAILED freezes the
  // UI at that stage — later stages stay pending (backend gates the same way).
  const observeFrom = async (fromIdx: number): Promise<void> => {
    const id = requirementIdRef.current;
    if (!id) return;
    for (let idx = fromIdx; idx < TOTAL_STAGES; idx++) {
      setStage(idx);
      stageRef.current = idx;
      setPhase('running');
      setLoadingText(STAGE_LOADING_TEXTS[idx]?.[0] ?? 'Working…');
      const { outcome, stageStatus } = await waitForStage(idx);
      if (outcome === 'ready') {
        await STAGE_LOADERS[idx](id);
        continue;
      }
      // Backend paused/failed here — freeze, do NOT advance, offer retry.
      if (stageStatus === 'deferred' || stageStatus === 'timeout') {
        setPhase('review');
        setLoadingText(
          stageStatus === 'deferred'
            ? 'Stage deferred — all models busy. Retry when quota refreshes.'
            : 'Stage timed out waiting for the backend.'
        );
        pushFeed(
          'Stage waiting',
          'The backend paused this stage (quota/model pressure). Completed stages are kept; retry resumes from here.',
          'warning'
        );
      } else {
        setPhase('error');
        setLoadingText('Stage failed — see the activity feed for the reason.');
      }
      return;
    }
    // All six stages completed on the backend.
    setLoadingText('');
    setPhase('done');
    pushFeed('Pipeline completed', 'All 6 stages completed. Monitoring at 100%.', 'success');
    // FIX 14: the Project is created by the BACKEND only when Monitoring Summary
    // (stage 6) completes — /monitoring/{jobId} then returns project_id and the
    // activity feed gains a "project_created" event. No client-side POST here,
    // so no half-created project can appear mid-pipeline and no duplicate is
    // created when this hook resumes a completed run.
  };

  const restoreJob = async (jobIdValue: string, input?: IntakeStartInput | null): Promise<void> => {
    // Reconnect to an existing pipeline: backend state only, never a new run.
    requirementIdRef.current = jobIdValue;
    jobIdRef.current = jobIdValue;
    if (input) inputRef.current = input;
    setJobId(jobIdValue);
    setStarted(true);
    startedRef.current = true;
    setPhase('running');
    setLoadingText('Reconnecting to pipeline…');
    const snap = await fetchSnapshot(jobIdValue);
    if (snap) applyMonitorSnapshot(snap);
    await fetchActivity(jobIdValue);
    await fetchExecLogs(jobIdValue);
    // Load backend data for every completed stage so panels render instantly.
    const stages = Array.isArray(snap?.stages) ? (snap!.stages as Array<Record<string, unknown>>) : [];
    let firstOpen = TOTAL_STAGES;
    for (let idx = 0; idx < TOTAL_STAGES; idx++) {
      const st = String(stages.find((s) => s.key === PIPELINE_STAGE_KEYS[idx])?.status ?? '');
      if (st === 'completed' || st === 'success') {
        try {
          await STAGE_LOADERS[idx](jobIdValue);
        } catch {
          /* keep going */
        }
      } else if (firstOpen === TOTAL_STAGES) {
        firstOpen = idx;
      }
    }
    if (isTerminalSnapshot(snap ?? {})) {
      setStage(TOTAL_STAGES - 1);
      stageRef.current = TOTAL_STAGES - 1;
      setPhase('done');
      setLoadingText('');
      return;
    }
    ensurePolling(jobIdValue);
    if (firstOpen < TOTAL_STAGES) {
      await observeFrom(firstOpen);
    } else {
      setPhase('done');
      setLoadingText('');
    }
  };

  const start = useCallback((input: IntakeStartInput) => {
    if (runningRef.current) return;
    runningRef.current = true;
    stopPolling();
    failAllWaiters();
    setStarted(true);
    startedRef.current = true;
    setError('');
    requirementIdRef.current = undefined;
    jobIdRef.current = undefined;
    stageRef.current = -1;
    setJobId(undefined);
    setMonitoring({ status: 'idle', progress: 0, taskCount: 0, sprintCount: 0, retries: 0, stages: [] });
    setRequirements([]);
    setFeatures([]);
    setTasks([]);
    setAssignments({});
    setMatches({});
    setSprints([]);
    setFeed([]);
    setActivityFeed([]);
    setExecLogs([]);
    setBusy(false);
    setStage(-1);
    setPhase('running');
    setLoadingText('Creating requirement…');
    inputRef.current = input;

    void (async () => {
      try {
        const sourceKind = sourceKindFromFile(input.file ?? null);
        const created = await requirementsApi
          .create({
            title: input.projectName,
            description: (input.description || input.sourceText || '').slice(0, 2000),
            source: sourceKind,
            client_name: input.clientName || undefined,
            client_email: input.clientEmail || undefined,
            company: input.company || undefined,
            organization_name: input.company || undefined,
            project_priority: input.projectPriority || undefined,
            expected_delivery_date: input.expectedDeliveryDate || undefined,
          } as any)
          .catch(() => null);
        if (!created) {
          setError('Backend unreachable — requirement could not be created. Check the backend and try again.');
          setPhase('error');
          setLoadingText('');
          pushFeed('Start failed', 'Backend unreachable — no pipeline was created.', 'error');
          runningRef.current = false;
          return;
        }
        requirementIdRef.current = created.id;
        if (input.file) {
          try {
            await requirementsApi.uploadFile(created.id, input.file, sourceKind);
            pushFeed('Requirement document uploaded', `File referenced at /requirements/${created.id}`, 'success');
          } catch {
            pushFeed('File upload skipped', 'Text analysis proceeds from the pasted brief.', 'warning');
          }
        }
        setLoadingText('Starting backend pipeline…');
        const exec = await apiClient
          .post<{ jobId?: string; status?: string; currentStage?: string }>(
            `/requirements/${created.id}/execute`,
            { provider: input.provider || '', model: input.model || '' },
          )
          .catch(() => null);
        const jobIdValue = exec?.data?.jobId ?? created.id;
        requirementIdRef.current = jobIdValue;
        jobIdRef.current = jobIdValue;
        setJobId(jobIdValue);
        saveSession({ jobId: jobIdValue, requirementId: jobIdValue, input, startedAt: Date.now() });
        try {
          const url = new URL(window.location.href);
          url.searchParams.set('jobId', jobIdValue);
          window.history.replaceState(null, '', url.toString());
        } catch {
          /* ignore */
        }
        pushFeed('Pipeline started', 'Backend orchestrating requirements → features → tasks → engineers → sprints → monitoring.', 'success');
        pushFeed('Requirement persisted', `Created requirement “${input.projectName}”`, 'success');
        ensurePolling(jobIdValue);
        await observeFrom(0);
      } finally {
        runningRef.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    failAllWaiters();
    runningRef.current = false;
    startedRef.current = false;
    setStarted(false);
    setStage(-1);
    stageRef.current = -1;
    setPhase('idle');
    setLoadingText('');
    setError('');
    setRequirements([]);
    setFeatures([]);
    setTasks([]);
    setMembers([]);
    setAssignments({});
    setMatches({});
    setSprints([]);
    setFeed([]);
    setActivityFeed([]);
    setExecLogs([]);
    setBusy(false);
    inputRef.current = null;
    requirementIdRef.current = undefined;
    jobIdRef.current = undefined;
    setJobId(undefined);
    setMonitoring({ status: 'idle', progress: 0, taskCount: 0, sprintCount: 0, retries: 0, stages: [] });
    clearSession();
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('jobId');
      url.searchParams.delete('requirementId');
      window.history.replaceState(null, '', url.toString());
    } catch {
      /* ignore */
    }
  }, [stopPolling]);

  // ─── Restore on mount: deep link ?jobId= wins, else stored session ───
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlJob = params.get('jobId') || params.get('requirementId');
      const stored = loadSession();
      const jobIdValue = urlJob || stored?.jobId;
      if (jobIdValue && !startedRef.current) {
        void restoreJob(jobIdValue, stored?.input ?? null);
      }
    } catch {
      /* restore is best-effort */
    }
    return () => {
      stopPolling();
      failAllWaiters();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Single subscription lifecycle: (re)start with the job, stop on terminal ───
  useEffect(() => {
    if (!started || !jobId) return;
    const snap = monitoringRef.current;
    if (snap && isTerminalSnapshot({ pipelineStatus: snap.pipelineStatus, status: snap.status })) return;
    ensurePolling(jobId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, jobId]);

  // ─── Manual pipeline controls (Proceed / Retry / Cancel) ────
  const stageStatus = useCallback(
    (idx: number): string | undefined => {
      const key = PIPELINE_STAGE_KEYS[idx];
      const arr = monitoring.stages;
      return arr.find((s) => s.key === key)?.status ?? arr[idx]?.status;
    },
    [monitoring.stages]
  );

  const proceedToNext = useCallback(async () => {
    const nextIdx = stageRef.current + 1;
    if (!requirementIdRef.current || nextIdx < 0 || nextIdx >= TOTAL_STAGES) return;
    setBusy(true);
    try {
      const res = await apiClient.post<Record<string, unknown>>(
        `/requirements/${requirementIdRef.current}/next-stage`,
        { stage: API_STAGE_NAMES[nextIdx], jobId: jobIdRef.current ?? requirementIdRef.current }
      );
      const status = String(res.data?.status ?? '');
      if (res.data?.snapshot) applyMonitorSnapshot(res.data.snapshot as Record<string, unknown>);
      if (status === 'alreadyCompleted') {
        pushFeed('Stage already complete', 'Backend reports this stage finished — showing persisted results.', 'info');
      } else if (status === 'alreadyRunning') {
        pushFeed('Stage already running', 'Backend is still executing — watching live progress.', 'info');
      } else {
        pushFeed('Stage started on backend', `Backend running ${API_STAGE_NAMES[nextIdx]} — watching live progress.`, 'info');
      }
      ensurePolling(requirementIdRef.current);
      await observeFrom(nextIdx);
    } catch (e) {
      pushFeed('Proceed degraded', `Backend stage trigger failed (${getApiErrorMessage(e)}) — observing backend state.`, 'warning');
    } finally {
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retryCurrentStage = useCallback(async () => {
    const idx = Math.max(0, stageRef.current);
    if (!requirementIdRef.current) return;
    setBusy(true);
    try {
      const res = await apiClient.post<Record<string, unknown>>(
        `/requirements/${requirementIdRef.current}/retry-stage`,
        { stage: API_STAGE_NAMES[idx], jobId: jobIdRef.current ?? requirementIdRef.current }
      );
      if (res.data?.snapshot) applyMonitorSnapshot(res.data.snapshot as Record<string, unknown>);
      pushFeed('Retrying stage on backend', `Backend re-running ${API_STAGE_NAMES[idx]} and continuing automatically.`, 'info');
      setPhase('running');
      setLoadingText(`Retrying ${API_STAGE_NAMES[idx].replace(/_/g, ' ')}…`);
      ensurePolling(requirementIdRef.current);
      // Backend resumes from this stage through the end automatically.
      await observeFrom(idx);
    } catch (e) {
      pushFeed('Retry degraded', getApiErrorMessage(e), 'warning');
    } finally {
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelPipeline = useCallback(async () => {
    if (!requirementIdRef.current) return;
    setBusy(true);
    try {
      const res = await apiClient.post<Record<string, unknown>>(
        `/requirements/${requirementIdRef.current}/cancel`,
        {}
      );
      if (res.data?.snapshot) applyMonitorSnapshot(res.data.snapshot as Record<string, unknown>);
      pushFeed('Pipeline cancelled', 'Background execution was asked to stop.', 'warning');
    } catch (e) {
      pushFeed('Cancel degraded', getApiErrorMessage(e), 'warning');
    } finally {
      setBusy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => {
    stopPolling();
    failAllWaiters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // BUG 14: Retry disabled while the pipeline is paused waiting for a
  // refresh window (deferredPaused) OR when a stage is blocked and NO
  // API-supported model is available in the ownership dashboard.
  const retryDisabled =
    deferredPaused ||
    Boolean(
      monitoring.currentBlockedStage &&
      Array.isArray(monitoring.modelStates) &&
      monitoring.modelStates.length > 0 &&
      !monitoring.modelStates.some(
        (m) => Boolean((m as { retryable?: boolean }).retryable)
      )
    );
  const retryBlockedReason =
    deferredPaused
      ? 'Retry scheduled automatically — waiting for the model refresh window or the backend retry queue.'
      : monitoring.currentBlockedStage
        ? 'No API-supported model is available yet — Retry stays disabled until the backend registers one.'
        : '';

  const guardedRetryCurrentStage = useCallback(async () => {
    if (retryDisabled) {
      pushFeed('Retry blocked', retryBlockedReason, 'warning');
      return;
    }
    return retryCurrentStage();
  }, [retryDisabled, retryBlockedReason, retryCurrentStage]);

  return {
    started,
    stage,
    phase,
    loadingText,
    error,
    busy,
    requirements,
    features,
    tasks,
    members,
    assignments,
    matches,
    sprints,
    feed,
    activityFeed,
    execLogs,
    persistedSprints,
    monitoring,
    jobId,
    deferredPaused,
    deferredCountdown,
    setRequirements,
    setFeatures,
    setTasks,
    setAssignments,
    start,
    reset,
    proceedToNext,
    retryCurrentStage: guardedRetryCurrentStage,
    cancelPipeline,
    stageStatus,
    // BUG 11 + 14: expose pause banner + retry gate to UI
    blockingReason: monitoring.blockingReason,
    currentBlockedStage: monitoring.currentBlockedStage,
    refreshAt: monitoring.refreshAt,
    retryAfterSeconds: monitoring.retryAfterSeconds,
    retryAttemptCount: monitoring.retryAttemptCount,
    maxRetries: monitoring.maxRetries,
    retryDisabled,
    retryBlockedReason,
  };
}
