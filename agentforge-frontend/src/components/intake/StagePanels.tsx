// src/components/intake/StagePanels.tsx

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Pencil,
  Trash2,
  Plus,
  Split,
  WrapText,
  Merge,
  ChevronDown,
  ChevronRight,
  Search,
  Sparkles,
  Loader2,
  UserRound,
  GripVertical,
  ArrowRight,
  CalendarDays,
  Clock,
  ShieldAlert,
  AlertTriangle,
  ListChecks,
  MonitorUp,
  Gauge,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  DEPARTMENTS,
  deptMeta,
  FeatPriority,
  IntakeFeature,
  IntakeMember,
  IntakeRequirement,
  IntakeSprint,
  IntakeTask,
  MemberMatch,
  PRIORITY_META,
  StagePhase,
  uid,
} from '@/lib/intake';

// ─── Shared bits ─────────────────────────────────────────────────────

const PRIORITIES: FeatPriority[] = ['low', 'medium', 'high', 'critical'];

function IntakeSelect({
  value,
  onChange,
  options,
  className,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-8 rounded-lg border border-canvas-border bg-canvas-surface px-2 pr-7 text-xs font-medium text-text-heading',
        'focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all',
        className
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function PriorityBadge({ priority }: { priority: FeatPriority }) {
  const meta = PRIORITY_META[priority];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium', meta.badge)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

function LoadingPanel({ loadingText }: { loadingText: string }) {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-3 py-2"
    >
      <div className="flex items-center gap-2.5 text-sm font-medium text-text-heading">
        <Loader2 size={16} className="animate-spin text-brand-primary" />
        <span className="animate-pulse">{loadingText || 'Processing…'}</span>
      </div>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.25 }}
          className={cn('rounded-xl border border-canvas-border bg-canvas-surface/60', i === 2 ? 'h-10 w-3/4' : 'h-12')}
        />
      ))}
    </motion.div>
  );
}

function StageFooter({
  onContinue,
  label = 'Continue',
  hint,
  onRetry,
  showRetry,
  busy,
}: {
  onContinue: () => void;
  label?: string;
  hint?: string;
  onRetry?: () => void;
  showRetry?: boolean;
  busy?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-canvas-border">
      <p className="text-xs text-text-muted">{hint}</p>
      <div className="flex items-center gap-2">
        {showRetry && onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} disabled={busy}>
            <RefreshCw size={14} />
            Retry
          </Button>
        )}
        <Button onClick={onContinue} disabled={busy}>
          {busy ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 size={15} className="animate-spin" />
              Running…
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              {label}
              <ArrowRight size={15} />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

// Retry is offered only when the BACKEND reports this stage failed/deferred.
const showRetryFor = (status?: string) => status === 'failed' || status === 'deferred' || status === 'error';

const groupByDept = (tasks: IntakeTask[]) =>
  DEPARTMENTS.map((d) => ({ dept: d, items: tasks.filter((t) => t.department === d.key) })).filter((g) => g.items.length > 0);

// ─── Stage 1 · Requirements ──────────────────────────────────────────

interface RequirementsPanelProps {
  requirements: IntakeRequirement[];
  onChange: (r: IntakeRequirement[]) => void;
  phase: StagePhase;
  loadingText: string;
  onContinue: () => void;
  onRetry?: () => void;
  backendStatus?: string;
  busy?: boolean;
}

export function RequirementsPanel({ requirements, onChange, phase, loadingText, onContinue, onRetry, backendStatus, busy }: RequirementsPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ title: string; description: string; priority: FeatPriority }>({
    title: '',
    description: '',
    priority: 'medium',
  });

  if (phase === 'running') return <LoadingPanel loadingText={loadingText} />;

  const startEdit = (r?: IntakeRequirement) => {
    setEditingId(r ? r.id : uid());
    setDraft(r ? { title: r.title, description: r.description, priority: r.priority } : { title: '', description: '', priority: 'medium' });
  };

  const saveEdit = () => {
    if (!editingId || !draft.title.trim()) return;
    const existing = requirements.find((r) => r.id === editingId);
    if (existing) {
      onChange(requirements.map((r) => (r.id === editingId ? { ...r, ...draft, title: draft.title.trim(), description: draft.description } : r)));
    } else {
      onChange([...requirements, { id: editingId, title: draft.title.trim(), description: draft.description, priority: draft.priority, tags: ['manual'] }]);
    }
    setEditingId(null);
  };

  const remove = (id: string) => onChange(requirements.filter((r) => r.id !== id));

  return (
    <motion.div key="requirements" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-semibold text-text-heading">Requirements Summary</h4>
          <p className="text-xs text-text-muted">{requirements.length} requirements extracted — refine then continue</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => startEdit()}>
          <Plus size={14} />
          Add requirement
        </Button>
      </div>

      <div className="space-y-3">
        {requirements.map((r) => (
          <div key={r.id} className="rounded-xl border border-canvas-border bg-canvas-surface/60 p-4">
            {editingId === r.id ? (
              <div className="space-y-3">
                <Input label="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
                <Textarea label="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="min-h-[70px]" />
                <div className="flex items-center justify-between gap-3">
                  <IntakeSelect
                    value={draft.priority}
                    onChange={(v) => setDraft({ ...draft, priority: v as FeatPriority })}
                    options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].label }))}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit} disabled={!draft.title.trim()}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-heading">{r.title}</p>
                    <p className="text-xs text-text-muted mt-1 leading-relaxed">{r.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={r.priority} />
                    <button onClick={() => startEdit(r)} className="p-1.5 rounded-lg text-text-muted hover:text-text-heading hover:bg-canvas-surface transition-colors" aria-label="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => remove(r.id)} className="p-1.5 rounded-lg text-text-muted hover:text-error-600 hover:bg-error-50 transition-colors" aria-label="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {r.tags.map((t) => (
                    <span key={t} className="rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-medium px-2 py-0.5">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <StageFooter
        onContinue={onContinue}
        label="Proceed to Feature Extraction"
        hint="Requirement analysis complete. Continue to break these down into implementation features."
        onRetry={onRetry}
        showRetry={showRetryFor(backendStatus)}
        busy={busy}
      />
    </motion.div>
  );
}

// ─── Stage 2 · Features ──────────────────────────────────────────────

interface FeaturesPanelProps {
  features: IntakeFeature[];
  onChange: (f: IntakeFeature[]) => void;
  phase: StagePhase;
  loadingText: string;
  onContinue: () => void;
  onRetry?: () => void;
  backendStatus?: string;
  busy?: boolean;
}

export function FeaturesPanel({ features, onChange, phase, loadingText, onContinue, onRetry, backendStatus, busy }: FeaturesPanelProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);

  if (phase === 'running') return <LoadingPanel loadingText={loadingText} />;

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const mergeSelected = () => {
    if (selected.size < 2) return;
    const list = features.filter((f) => selected.has(f.id));
    const kept = [...list].sort((a, b) => features.indexOf(a) - features.indexOf(b))[0];
    const merged: IntakeFeature = {
      ...kept,
      title: list.map((f) => f.title).join(' + '),
      description: list.map((f) => f.description).filter(Boolean).join(' '),
      dependencies: [...new Set(list.flatMap((f) => f.dependencies))],
    };
    onChange([merged, ...features.filter((f) => !selected.has(f.id))]);
    setSelected(new Set());
  };

  const splitSelected = () => {
    const target = features.find((f) => f.id === [...selected][0] && selected.size === 1);
    if (!target) return;
    const titleParts = target.title.split(/[\s—–-]+/).filter((w) => w.length > 3 && w.toLowerCase() !== 'and' && w.toLowerCase() !== 'the');
    const nameA = titleParts.length >= 2 ? titleParts.slice(0, Math.ceil(titleParts.length / 2)).join(' ') : `${target.title} — Core`;
    const nameB = titleParts.length >= 2 ? titleParts.slice(Math.ceil(titleParts.length / 2)).join(' ') : `${target.title} — Extended`;
    const a: IntakeFeature = { ...target, id: uid(), title: nameA, hours: Math.max(4, Math.ceil(target.hours / 2)), dependencies: [] };
    const b: IntakeFeature = { ...target, id: uid(), title: nameB, hours: Math.max(4, Math.ceil(target.hours / 2)), dependencies: [nameA] };
    onChange([...features.filter((f) => f.id !== target.id), a, b]);
    setSelected(new Set());
  };

  const addFeature = () => {
    const f: IntakeFeature = {
      id: uid(),
      title: 'New Feature',
      description: 'Describe what this feature delivers.',
      priority: 'medium',
      complexity: 'medium',
      hours: 16,
      dependencies: [],
      tags: ['manual'],
    };
    onChange([f, ...features]);
    setEditingId(f.id);
  };

  const removeSelected = () => onChange(features.filter((f) => !selected.has(f.id)));

  const update = (id: string, patch: Partial<IntakeFeature>) => onChange(features.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  return (
    <motion.div key="features" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-semibold text-text-heading">Extracted Features</h4>
          <p className="text-xs text-text-muted">{features.length} features — rename, merge, split or add before continuing</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size >= 2 && (
            <Button variant="outline" size="sm" onClick={mergeSelected}>
              <Merge size={14} />
              Merge ({selected.size})
            </Button>
          )}
          {selected.size === 1 && (
            <Button variant="outline" size="sm" onClick={splitSelected}>
              <Split size={14} />
              Split
            </Button>
          )}
          {selected.size > 0 && (
            <Button variant="danger" size="sm" onClick={removeSelected}>
              <Trash2 size={14} />
              Remove ({selected.size})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={addFeature}>
            <Plus size={14} />
            Add feature
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {features.map((f) => (
          <div key={f.id} className="rounded-xl border border-canvas-border bg-canvas-surface/60 p-4">
            <div className="flex items-start gap-2.5">
              <label className="mt-0.5">
                <input
                  type="checkbox"
                  checked={selected.has(f.id)}
                  onChange={() => toggle(f.id)}
                  className="accent-brand-primary h-4 w-4 rounded"
                />
              </label>
              <div className="min-w-0 flex-1">
                {editingId === f.id ? (
                  <div className="space-y-2">
                    <Input value={f.title} onChange={(e) => update(f.id, { title: e.target.value })} />
                    <Textarea value={f.description} onChange={(e) => update(f.id, { description: e.target.value })} className="min-h-[60px]" />
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-text-heading">{f.title}</p>
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{f.description}</p>
                  </>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setEditingId(editingId === f.id ? null : f.id)} className="p-1.5 rounded-lg text-text-muted hover:text-text-heading hover:bg-canvas-surface transition-colors" aria-label="Edit">
                  <Pencil size={14} />
                </button>
                <button onClick={() => onChange(features.filter((x) => x.id !== f.id))} className="p-1.5 rounded-lg text-text-muted hover:text-error-600 hover:bg-error-50 transition-colors" aria-label="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <PriorityBadge priority={f.priority} />
              <span className="rounded-full bg-canvas-surface border border-canvas-border px-2 py-0.5 text-[11px] font-medium text-text-body">
                {f.complexity} complexity
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-canvas-surface border border-canvas-border px-2 py-0.5 text-[11px] font-medium text-text-body">
                <Clock size={11} />
                {f.hours}h
              </span>
              {f.dependencies.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-info-50 border border-info-100 px-2 py-0.5 text-[11px] font-medium text-info-700">
                  <WrapText size={11} />
                  {f.dependencies.length} dep{f.dependencies.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <StageFooter
        onContinue={onContinue}
        label="Proceed to Task Segregation"
        hint={`${features.length} features ready. Continue to break these down into department tasks.`}
        onRetry={onRetry}
        showRetry={showRetryFor(backendStatus)}
        busy={busy}
      />
    </motion.div>
  );
}

// ─── Stage 3 · Tasks ─────────────────────────────────────────────────

interface TasksPanelProps {
  tasks: IntakeTask[];
  onChange: (t: IntakeTask[]) => void;
  phase: StagePhase;
  loadingText: string;
  onContinue: () => void;
  onRetry?: () => void;
  backendStatus?: string;
  busy?: boolean;
}

const DEFAULT_SPRINT: Record<string, string> = {};

export function TasksPanel({ tasks, onChange, phase, loadingText, onContinue, onRetry, backendStatus, busy }: TasksPanelProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [sprints, setSprints] = useState<Record<string, string>>(DEFAULT_SPRINT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ title: string; hours: number }>({ title: '', hours: 8 });

  if (phase === 'running') return <LoadingPanel loadingText={loadingText} />;

  const groups = groupByDept(tasks);
  const toggleGroup = (key: string) => setExpanded((e) => ({ ...e, [key]: !(e[key] ?? true) }));

  const updateTask = (id: string, patch: Partial<IntakeTask>) => onChange(tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const addToGroup = (dept: string) => {
    const t: IntakeTask = {
      id: uid(),
      title: draft.title.trim() || 'Untitled Task',
      description: 'Manually added task.',
      featureTitle: 'Manual',
      department: dept as IntakeTask['department'],
      priority: 'medium',
      module: 'Manual',
      hours: Math.max(1, draft.hours || 8),
      skills: [],
    };
    onChange([t, ...tasks]);
    setEditingId(null);
    setDraft({ title: '', hours: 8 });
  };

  const groupHeading = (dept: string) => {
    const meta = deptMeta(dept as IntakeTask['department']);
    return {
      label: meta.label,
      bar: meta.bar,
      iconBg: meta.iconBg,
      iconText: meta.iconText,
      count: tasks.filter((t) => t.department === dept).length,
    };
  };

  return (
    <motion.div key="tasks" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-semibold text-text-heading">Task Segregation</h4>
          <p className="text-xs text-text-muted">{tasks.length} tasks grouped by department — review, re-assign and refine</p>
        </div>
        <div className="flex items-center gap-2">
          <IntakeSelect
            value=""
            onChange={(v) => v && addToGroup(v)}
            options={[{ value: '', label: 'Add task to department…' }, ...DEPARTMENTS.map((d) => ({ value: d.key, label: d.label }))]}
          />
        </div>
      </div>

      <div className="space-y-3">
        {groups.map(({ dept }) => {
          const heading = groupHeading(dept.key);
          const isOpen = expanded[dept.key] ?? true;
          const deptTasks = tasks.filter((t) => t.department === dept.key);
          const totalHours = deptTasks.reduce((s, t) => s + t.hours, 0);
          return (
            <div key={dept.key} className="rounded-xl border border-canvas-border bg-canvas-surface/50 overflow-hidden">
              <button onClick={() => toggleGroup(dept.key)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-canvas-surface/70 transition-colors">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', dept.iconBg)}>
                  <span className={cn('font-semibold text-xs', dept.iconText)}>{dept.label[0]}</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-text-heading">{dept.label}</p>
                  <p className="text-[11px] text-text-muted">{deptTasks.length} tasks · {totalHours}h estimated</p>
                </div>
                <div className="flex-1 max-w-[220px] hidden sm:block">
                  <div className="h-1.5 rounded-full bg-canvas-surface overflow-hidden">
                    <div className={cn('h-full rounded-full', dept.bar)} style={{ width: `${Math.min(100, (totalHours / 80) * 100)}%` }} />
                  </div>
                </div>
                {isOpen ? <ChevronDown size={16} className="text-text-muted" /> : <ChevronRight size={16} className="text-text-muted" />}
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                    <div className="px-3 pb-3 space-y-2">
                      {deptTasks.map((t) => (
                        <div key={t.id} className="rounded-lg border border-canvas-border bg-canvas-surface/70 p-3">
                          {editingId === t.id ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="min-w-[180px]" placeholder="Task title" />
                              <Input type="number" min={1} value={String(draft.hours)} onChange={(e) => setDraft({ ...draft, hours: Number(e.target.value) || 1 })} className="w-20" placeholder="Hours" />
                              <Button size="sm" onClick={() => { updateTask(t.id, { title: draft.title.trim() || t.title, hours: draft.hours || 1 }); setEditingId(null); }}>Save</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-text-heading min-w-[180px]">{t.title}</p>
                              <IntakeSelect
                                value={t.department}
                                onChange={(v) => updateTask(t.id, { department: v as IntakeTask['department'] })}
                                options={DEPARTMENTS.map((d) => ({ value: d.key, label: d.label }))}
                              />
                              <IntakeSelect
                                value={t.priority}
                                onChange={(v) => updateTask(t.id, { priority: v as FeatPriority })}
                                options={PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].label }))}
                              />
                              <IntakeSelect
                                value={sprints[t.id] ?? 'suggested'}
                                onChange={(v) => setSprints((s) => ({ ...s, [t.id]: v }))}
                                options={[
                                  { value: 'suggested', label: 'Sprint: AI suggestion' },
                                  { value: '1', label: 'Sprint 1' },
                                  { value: '2', label: 'Sprint 2' },
                                  { value: '3', label: 'Sprint 3' },
                                  { value: '4', label: 'Sprint 4' },
                                ]}
                              />
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-text-body">
                                <Clock size={11} />
                                {t.hours}h
                              </span>
                              <div className="flex flex-wrap gap-1 ml-auto">
                                {t.skills.slice(0, 3).map((sk) => (
                                  <span key={sk} className="rounded-full bg-canvas-surface border border-canvas-border px-1.5 py-0.5 text-[10px] text-text-muted">
                                    {sk}
                                  </span>
                                ))}
                              </div>
                              <button onClick={() => { setEditingId(t.id); setDraft({ title: t.title, hours: t.hours }); }} className="p-1.5 rounded-lg text-text-muted hover:text-text-heading hover:bg-canvas-surface transition-colors" aria-label="Edit">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => onChange(tasks.filter((x) => x.id !== t.id))} className="p-1.5 rounded-lg text-text-muted hover:text-error-600 hover:bg-error-50 transition-colors" aria-label="Delete">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <StageFooter
        onContinue={onContinue}
        label="Generate AI Assignments"
        hint={`${tasks.length} tasks segregated. Continue to let AI match every task to the right engineer.`}
        onRetry={onRetry}
        showRetry={showRetryFor(backendStatus)}
        busy={busy}
      />
    </motion.div>
  );
}

// ─── Stage 4 · Assignments ───────────────────────────────────────────

interface AssignmentsPanelProps {
  tasks: IntakeTask[];
  members: IntakeMember[];
  assignments: Record<string, string>;
  matches: Record<string, MemberMatch>;
  onChangeAssignments: (a: Record<string, string>) => void;
  phase: StagePhase;
  loadingText: string;
  onContinue: () => void;
  onRetry?: () => void;
  backendStatus?: string;
  busy?: boolean;
}

const SKILL_FILTERS = ['React', 'Python', 'Testing', 'Docker', 'JWT', 'Android'];

export function AssignmentsPanel({
  tasks,
  members,
  assignments,
  matches,
  onChangeAssignments,
  phase,
  loadingText,
  onContinue,
  onRetry,
  backendStatus,
  busy,
}: AssignmentsPanelProps) {
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [reviewing, setReviewing] = useState(false);
  const [flash, setFlash] = useState(false);

  if (phase === 'running' && members.length === 0) return <LoadingPanel loadingText={loadingText} />;

  const toggle = (f: string) => {
    const next = new Set(skillFilter);
    if (next.has(f)) next.delete(f);
    else next.add(f);
    setSkillFilter(next);
  };

  const filtered = tasks.filter((t) => {
    const q = search.toLowerCase();
    const matchesQ = !q || t.title.toLowerCase().includes(q) || t.featureTitle.toLowerCase().includes(q);
    const matchesSkill = skillFilter.size === 0 || [...skillFilter].some((s) => t.skills.some((sk) => sk.toLowerCase().includes(s.toLowerCase())));
    return matchesQ && matchesSkill;
  });

  const groups = groupByDept(filtered);

  const memberWorkload = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of members) counts[m.id] = 0;
    for (const id of Object.values(assignments)) if (id && counts[id] !== undefined) counts[id] += 1;
    return counts;
  }, [members, assignments]);

  const assign = (taskId: string, memberId: string) => onChangeAssignments({ ...assignments, [taskId]: memberId });

  const applyToSelected = (memberId: string) => {
    const next = { ...assignments };
    for (const id of selected) next[id] = memberId;
    onChangeAssignments(next);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 1200);
    setSelected(new Set());
  };

  const arrivalById = (id: string): IntakeMember | undefined => members.find((m) => m.id === id);

  return (
    <motion.div key="assignments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-semibold text-text-heading">AI Assignment Suggestions</h4>
          <p className="text-xs text-text-muted">AI matched engineers by skill & workload — approve or reassign before committing</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks…"
              className="h-8 w-40 rounded-lg border border-canvas-border bg-canvas-surface pl-8 pr-2 text-xs text-text-heading focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <span className="text-[11px] font-medium text-text-muted mr-1">Skill:</span>
        {SKILL_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => toggle(s)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
              skillFilter.has(s)
                ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/30'
                : 'bg-canvas-surface text-text-muted border-canvas-border hover:text-text-heading'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Member pool — draggable onto tasks */}
      <div className="rounded-xl border border-canvas-border bg-canvas-surface/50 p-3 mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-text-heading uppercase tracking-wide">Team</p>
          <span className="text-[11px] text-text-muted">Drag an engineer onto a task to assign</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => {
            const load = memberWorkload[m.id] ?? 0;
            const width = Math.min(100, load * 18);
            const barColor = load > 6 ? 'bg-error-500' : load > 3 ? 'bg-warning-500' : 'bg-success-500';
            const isMock = m.member_type === 'mock_user';
            return (
              <div
                key={m.id}
                draggable={!isMock && m.availability !== 'leave'}
                onDragStart={(e) => {
                  if (isMock) {
                    e.preventDefault();
                    return;
                  }
                  e.dataTransfer.setData('text/plain', m.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                className={cn(
                  'group rounded-xl border bg-card p-2 pr-3 flex items-center gap-2 transition-all hover:border-brand-primary/50 hover:shadow-glass',
                  m.availability === 'leave' ? 'opacity-45' : '',
                  isMock ? 'cursor-not-allowed opacity-80 border-dashed' : 'cursor-grab'
                )}
              >
                <GripVertical size={13} className={cn('text-text-muted', isMock && 'opacity-50')} />
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center text-[10px] font-bold text-white">
                  {m.full_name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('')}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text-heading leading-tight flex items-center gap-1">
                    {m.full_name}
                    {isMock && (
                      <span className="text-[9px] font-bold uppercase text-error-600 bg-error-50 px-1 rounded">MOCK USER</span>
                    )}
                  </p>
                  <p className="text-[10px] text-text-muted truncate max-w-[120px]">{m.role.replace(/_/g, ' ').toUpperCase()}</p>
                  {m.employment_id && (
                    <p className="text-[9px] text-text-muted truncate">ID: {m.employment_id}</p>
                  )}
                </div>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                    m.availability === 'available'
                      ? 'bg-success-50 text-success-700'
                      : m.availability === 'busy'
                      ? 'bg-warning-50 text-warning-700'
                      : 'bg-canvas-surface text-text-muted'
                  )}
                >
                  {m.availability === 'available' ? 'Available' : m.availability === 'busy' ? 'Busy' : 'On leave'}
                </span>
                <div className="w-14">
                  <div className="h-1 rounded-full bg-canvas-surface overflow-hidden mt-0.5">
                    <div className={cn('h-full rounded-full', barColor)} style={{ width: `${width}%` }} />
                  </div>
                  <p className="text-[9px] text-text-muted mt-0.5 text-right">{load} task{load === 1 ? '' : 's'}</p>
                </div>
              </div>
            );
          })}
          {members.length === 0 && (
            <p className="text-xs text-text-muted py-2">No team members yet — invite your team from the Team page.</p>
          )}
        </div>
      </div>

      {/* Tasks grouped by department */}
      <div className="space-y-3">
        {groups.map(({ dept, items }) => (
          <div key={dept.key} className="rounded-xl border border-canvas-border overflow-hidden">
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-canvas-surface/60 border-b border-canvas-border">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', dept.iconBg)}>
                <span className={cn('font-semibold text-xs', dept.iconText)}>{dept.label[0]}</span>
              </div>
              <p className="text-xs font-semibold text-text-heading">{dept.label}</p>
              <span className="ml-auto text-[11px] text-text-muted">{items.length} tasks</span>
            </div>
            <div className="divide-y divide-canvas-border">
              {items.map((t) => {
                const match = matches[t.id];
                const currentMember = arrivalById(assignments[t.id]);
                return (
                  <div
                    key={t.id}
                    draggable={false}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) => {
                      const memberId = e.dataTransfer.getData('text/plain');
                      if (memberId) assign(t.id, memberId);
                    }}
                    className="px-4 py-3 bg-card hover:bg-canvas-surface/50 transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selected.has(t.id)}
                          onChange={() => {
                            const next = new Set(selected);
                            if (next.has(t.id)) next.delete(t.id);
                            else next.add(t.id);
                            setSelected(next);
                          }}
                          className="accent-brand-primary h-4 w-4 rounded"
                        />
                      </label>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text-heading truncate">{t.title}</p>
                        <p className="text-[11px] text-text-muted truncate">
                          {t.featureTitle} · {t.priority} · {t.hours}h
                        </p>
                      </div>

                      {currentMember ? (
                        <div className="flex items-center gap-2 min-w-[150px]">
                          <div className="w-6 h-6 rounded-full bg-brand-primary/15 flex items-center justify-center text-[9px] font-bold text-brand-primary">
                            {currentMember.full_name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('')}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-text-heading leading-tight flex items-center gap-1">
                              {currentMember.full_name}
                              {currentMember.member_type === 'mock_user' && (
                                <span className="text-[8px] font-bold uppercase text-error-600 bg-error-50 px-1 rounded">MOCK</span>
                              )}
                            </p>
                            {match && (
                              <p className="text-[10px] text-success-600 font-medium">AI match {Math.min(97, Math.max(40, Math.round(match.score * 11)))}%</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-text-muted min-w-[100px] italic">Not assigned</span>
                      )}

                      <IntakeSelect
                        value={assignments[t.id] ?? ''}
                        onChange={(v) => assign(t.id, v)}
                        options={[
                          { value: '', label: 'Unassigned' },
                          ...members.map((m) => ({
                            value: m.id,
                            label: m.availability === 'leave' ? `${m.full_name} (on leave)` : m.full_name,
                          })),
                        ]}
                        className="min-w-[140px]"
                      />
                    </div>
                    {currentMember && match && (
                      <p className="text-[11px] text-text-muted mt-1.5 pl-8 flex items-center gap-1.5">
                        <Sparkles size={11} className="text-brand-primary" />
                        {match.reasons.join(' · ')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky review / commit bar */}
      <div className="sticky bottom-4 z-20 mt-5">
        <div className="rounded-2xl border border-canvas-border bg-canvas-surface/95 backdrop-blur-md shadow-glass p-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-text-heading min-w-[80px]">
            {selected.size > 0 ? `${selected.size} selected` : 'Assignment review'}
          </span>
          <IntakeSelect
            value=""
            onChange={(v) => v && applyToSelected(v)}
            options={[{ value: '', label: 'Assign selected to…' }, ...members.map((m) => ({ value: m.id, label: m.full_name }))]}
            disabled={selected.size === 0}
          />
          <Button size="sm" variant="outline" onClick={() => setReviewing((rv) => !rv)}>
            {reviewing ? 'Hide Review' : 'Review Changes'}
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <AnimatePresence>
              {flash && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-success-600"
                >
                  <CheckCircle2 size={15} />
                  Assigned
                </motion.div>
              )}
            </AnimatePresence>
            {showRetryFor(backendStatus) && onRetry && (
              <Button size="sm" variant="outline" onClick={onRetry} disabled={busy}>
                <RefreshCw size={14} />
                Retry
              </Button>
            )}
            <Button size="sm" onClick={onContinue} disabled={phase !== 'review' || busy}>
              {busy ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 size={14} className="animate-spin" />
                  Running…
                </span>
              ) : (
                <>
                  Confirm & Assign Tasks
                  <ArrowRight size={14} />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {reviewing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-info-200 bg-info-50/60 p-4 mt-3 max-h-64 overflow-y-auto">
              <p className="text-xs font-semibold text-info-700 mb-2">Assignment changes preview</p>
              <div className="space-y-1.5">
                {tasks.slice(0, 40).map((t) => {
                  const m = arrivalById(assignments[t.id]);
                  return (
                    <div key={t.id} className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-text-body truncate">{t.title}</span>
                      <span className="text-text-heading font-medium shrink-0">{m?.full_name ?? 'Unassigned'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Stage 5 · Sprints ───────────────────────────────────────────────

interface SprintsPanelProps {
  sprints: IntakeSprint[];
  tasks: IntakeTask[];
  assignments: Record<string, string>;
  phase: StagePhase;
  loadingText: string;
  persistedCount: number;
  onOpenMonitor: () => void;
  onRetry?: () => void;
  backendStatus?: string;
  busy?: boolean;
}

export function SprintsPanel({
  sprints,
  tasks,
  assignments,
  phase,
  loadingText,
  persistedCount,
  onOpenMonitor,
  onRetry,
  backendStatus,
  busy,
}: SprintsPanelProps) {
  const [blockers, setBlockers] = useState<Record<string, string[]>>({});
  const [blockerDraft, setBlockerDraft] = useState<Record<string, string>>({});

  if (phase === 'running') return <LoadingPanel loadingText={loadingText} />;

  const sprintTasks = (taskIds: string[]) => {
    const map = new Map(tasks.map((t) => [t.id, t]));
    return taskIds.map((id) => map.get(id)).filter(Boolean) as IntakeTask[];
  };

  const healthMeta = (h: IntakeSprint['health']) =>
    h === 'healthy'
      ? { label: 'On track', cls: 'bg-success-50 text-success-700 border-success-200', icon: CheckCircle2 }
      : h === 'at_risk'
      ? { label: 'At risk', cls: 'bg-warning-50 text-warning-700 border-warning-200', icon: AlertTriangle }
      : { label: 'Delayed', cls: 'bg-error-50 text-error-700 border-error-200', icon: ShieldAlert };

  return (
    <motion.div key="sprints" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-semibold text-text-heading">Sprint Monitoring</h4>
          <p className="text-xs text-text-muted">4 sprints planned from your backlog — open the monitor for the full dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          {showRetryFor(backendStatus) && onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} disabled={busy}>
              <RefreshCw size={14} />
              Retry Sprint Planning
            </Button>
          )}
          <Button onClick={onOpenMonitor} disabled={persistedCount === 0}>
            <span className="inline-flex items-center gap-1.5">
              <MonitorUp size={15} />
              Open Monitor
            </span>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {sprints.map((s, ei) => {
          const st = sprintTasks(s.taskIds);
          const membersCount = new Set(st.map((t) => assignments[t.id]).filter(Boolean)).size;
          const hMeta = healthMeta(s.health);
          const HIcon = hMeta.icon;
          const myBlockers = blockers[s.id] ?? [];
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ei * 0.08 }}
              className="rounded-2xl border border-canvas-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                    <CalendarDays size={15} className="text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-heading">{s.name}</p>
                    <p className="text-[11px] text-text-muted font-mono">{s.start_date} → {s.end_date}</p>
                  </div>
                </div>
                <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', hMeta.cls)}>
                  <HIcon size={11} />
                  {hMeta.label}
                </span>
              </div>

              <p className="text-xs text-text-muted mt-2.5 leading-relaxed">{s.goal}</p>

              <div className="flex items-center gap-4 mt-3">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-text-body">
                  <ListChecks size={12} className="text-text-muted" /> {st.length} tasks
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-text-body">
                  <UserRound size={12} className="text-text-muted" /> {membersCount} members
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-text-body">
                  <Clock size={12} className="text-text-muted" /> {s.totalHours}h
                </span>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-text-muted flex items-center gap-1">
                    <Gauge size={11} /> Completion
                  </span>
                  <span className="text-sm font-bold text-text-heading">{s.completion}%</span>
                </div>
                <div className="h-2 rounded-full bg-canvas-surface overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${s.completion}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: ei * 0.1 }}
                    className={cn('h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-primary-dark')}
                  />
                </div>
              </div>

              <div className="mt-3.5 space-y-1.5">
                {myBlockers.map((b) => (
                  <div key={b} className="flex items-center gap-1.5 text-[11px] text-error-600">
                    <ShieldAlert size={11} />
                    {b}
                    <button onClick={() => setBlockers({ ...blockers, [s.id]: myBlockers.filter((x) => x !== b) })} className="ml-auto text-text-muted hover:text-error-600" aria-label="Remove blocker">
                      ×
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <input
                    value={blockerDraft[s.id] ?? ''}
                    onChange={(e) => setBlockerDraft({ ...blockerDraft, [s.id]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (blockerDraft[s.id] ?? '').trim()) {
                        setBlockers({ ...blockers, [s.id]: [...myBlockers, blockerDraft[s.id].trim()] });
                        setBlockerDraft({ ...blockerDraft, [s.id]: '' });
                      }
                    }}
                    placeholder="Add a blocker…"
                    className="w-40 rounded-lg border border-canvas-border bg-canvas-surface px-2 py-1 text-[11px] text-text-heading focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none"
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {phase === 'done' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-5 rounded-xl border border-success-200 bg-success-50/70 p-4 flex items-center gap-3"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
            className="w-9 h-9 rounded-full bg-success-100 flex items-center justify-center"
          >
            <CheckCircle2 size={18} className="text-success-600" />
          </motion.div>
          <div>
            <p className="text-sm font-semibold text-success-700">Sprints created & synced to the Sprint Journal</p>
            <p className="text-xs text-success-600">Open Monitor to track progress, burndown and team workload.</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}