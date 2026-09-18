// src/pages/MeetingsPage.tsx

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarPlus, CalendarDays, Video, MapPin, Users, CheckCircle2,
  XCircle, Clock, Phone, Pencil, Trash2, Loader2, Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Skeleton } from '@/components/ui/Skeleton';
import { meetingsApi, Meeting, MeetingType, MeetingCreatePayload } from '@/api/meetings';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  sprint_planning: 'Sprint Planning',
  daily_standup: 'Daily Standup',
  sprint_review: 'Sprint Review',
  sprint_retrospective: 'Sprint Retrospective',
  client_call: 'Client Call',
  other: 'Other',
};

const MEETING_TYPE_ICONS: Record<MeetingType, React.ReactNode> = {
  sprint_planning: <CalendarDays className="h-4 w-4" />,
  daily_standup: <Users className="h-4 w-4" />,
  sprint_review: <CheckCircle2 className="h-4 w-4" />,
  sprint_retrospective: <Sparkles className="h-4 w-4" />,
  client_call: <Phone className="h-4 w-4" />,
  other: <Clock className="h-4 w-4" />,
};

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-info-500/20 text-info-500 border-info-500/30',
  in_progress: 'bg-warning-500/20 text-warning-500 border-warning-500/30',
  completed: 'bg-success-500/20 text-success-500 border-success-500/30',
  cancelled: 'bg-canvas-surface text-text-muted border-canvas-border',
};

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function MeetingsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [meetingType, setMeetingType] = useState<MeetingType>('sprint_planning');
  const [title, setTitle] = useState('');
  const [agenda, setAgenda] = useState('');
  const [startsAt, setStartsAt] = useState(() => toLocalInput(new Date(Date.now() + 3600000)));
  const [duration, setDuration] = useState('60');
  const [meetingLink, setMeetingLink] = useState('');
  const [minDuration, setMinDuration] = useState(30);
  const [maxDuration, setMaxDuration] = useState(120);

  const { data: meetings = [], isLoading, isError } = useQuery({
    queryKey: ['meetings', 'all'],
    queryFn: () => meetingsApi.list(),
    retry: false,
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (payload: MeetingCreatePayload) => meetingsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      setDialogOpen(false);
      setTitle('');
      setAgenda('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof meetingsApi.update>[1] }) =>
      meetingsApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => meetingsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  });

  const filtered = useMemo(() => {
    const now = Date.now();
    const sorted = [...meetings].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    if (filter === 'upcoming') return sorted.filter((m) => m.status === 'scheduled' || new Date(m.starts_at).getTime() >= now);
    if (filter === 'past') return sorted.filter((m) => new Date(m.starts_at).getTime() < now && m.status !== 'scheduled');
    return sorted;
  }, [meetings, filter]);

  const upcomingCount = meetings.filter(
    (m) => m.status === 'scheduled' || new Date(m.starts_at).getTime() >= Date.now()
  ).length;

  const handleCreate = () => {
    if (!title.trim()) return;
    const start = new Date(startsAt);
    const end = new Date(start.getTime() + (parseInt(duration, 10) || 60) * 60000);
    createMutation.mutate({
      title: title.trim(),
      meeting_type: meetingType,
      agenda: agenda.trim() || undefined,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      duration_minutes: parseInt(duration, 10) || 60,
      meeting_link: meetingLink.trim() || undefined,
    });
  };

  const todayMeetings = meetings.filter((m) => m.status !== 'cancelled' && isToday(m.starts_at));

  return (
    <div className="page-container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Sprint Meetings"
        description="Schedule sprint planning, daily standups, reviews, and retrospectives. AI agents will attend and take notes automatically."
        action={
          <Button onClick={() => setDialogOpen(true)} icon={<CalendarPlus className="h-4 w-4" />}>
            Schedule Meeting
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="p-5 bg-gradient-to-br from-brand-primary/10 to-brand-accent/10 border-canvas-border">
          <div className="text-xs text-text-muted mb-1">Upcoming</div>
          <p className="text-3xl font-bold text-text-heading">{upcomingCount}</p>
        </Card>
        <Card className="p-5 border-canvas-border">
          <div className="text-xs text-text-muted mb-1">Today</div>
          <p className="text-3xl font-bold text-text-heading">{todayMeetings.length}</p>
        </Card>
        <Card className="p-5 border-canvas-border">
          <div className="text-xs text-text-muted mb-1">Total</div>
          <p className="text-3xl font-bold text-text-heading">{meetings.length}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {(['upcoming', 'past', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-xl border transition-colors capitalize',
              filter === f
                ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/30'
                : 'border-canvas-border text-text-muted hover:text-text-heading hover:border-brand-primary/30'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="card" className="h-28" />)}
        </div>
      )}

      {isError && !isLoading && (
        <Card className="p-8 text-center border-canvas-border">
          <XCircle size={40} className="mx-auto mb-3 text-error-500/60" />
          <p className="text-text-muted">Failed to load meetings.</p>
        </Card>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <Card className="p-12 text-center border-dashed border-canvas-border">
          <CalendarDays size={48} className="mx-auto mb-4 text-text-muted/40" />
          <p className="text-text-muted mb-4">No meetings scheduled. Schedule your first sprint ceremony.</p>
          <Button onClick={() => setDialogOpen(true)} size="sm" icon={<CalendarPlus className="h-4 w-4" />}>
            Schedule Meeting
          </Button>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map((meeting) => (
          <Card key={meeting.id} className="p-5 border-canvas-border hover:border-brand-primary/30 transition-colors">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                  {MEETING_TYPE_ICONS[meeting.meeting_type] || MEETING_TYPE_ICONS.other}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-text-heading">{meeting.title}</h3>
                    <Badge className="text-[11px]">{MEETING_TYPE_LABELS[meeting.meeting_type] || meeting.meeting_type}</Badge>
                    <Badge className={cn('text-[11px]', STATUS_STYLES[meeting.status] || '')}>
                      {meeting.status?.charAt(0).toUpperCase() + meeting.status?.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-muted mt-1 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {format(new Date(meeting.starts_at), 'EEE, MMM d, yyyy · h:mm a')}
                    {meeting.duration_minutes ? ` · ${meeting.duration_minutes} min` : ''}
                  </p>
                  {meeting.agenda && (
                    <p className="text-sm text-text-body mt-2 line-clamp-2">{meeting.agenda}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-text-muted flex-wrap">
                    {meeting.meeting_link && (
                      <a href={meeting.meeting_link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-brand-primary hover:underline">
                        <Video className="h-3.5 w-3.5" /> Join link
                      </a>
                    )}
                    {meeting.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {meeting.location}
                      </span>
                    )}
                    {meeting.attendees && meeting.attendees.length > 0 && (
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" /> {meeting.attendees.length} attendees
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {meeting.status === 'scheduled' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateMutation.mutate({ id: meeting.id, payload: { status: 'completed' } })}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                  >
                    Mark complete
                  </Button>
                )}
                {meeting.status === 'scheduled' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateMutation.mutate({ id: meeting.id, payload: { status: 'cancelled' } })}
                    icon={<XCircle className="h-4 w-4" />}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setMinDuration(30); setMaxDuration(120); }}
                  className="text-text-muted"
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(meeting.id)}
                  className="text-error-600"
                  aria-label="Delete"
                  disabled={deleteMutation.isPending && deleteMutation.variables === meeting.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Schedule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen} className="max-w-2xl">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Sprint Meeting</DialogTitle>
            <DialogDescription>
              AI agents attend every ceremony and automatically capture notes, decisions, and action items.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <Input
              label="Meeting title"
              placeholder="Sprint 2 Planning"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <span className="label">Meeting type</span>
                <select
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value as MeetingType)}
                  className="w-full px-4 py-3 bg-canvas-surface border border-canvas-border rounded-xl text-sm text-text-heading focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all duration-200"
                >
                  {(Object.keys(MEETING_TYPE_LABELS) as MeetingType[]).map((t) => (
                    <option key={t} value={t}>{MEETING_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Duration (minutes)"
                type="number"
                min={10}
                step={5}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>

            <Input
              label="Start time"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />

            <Input
              label="Meeting link (optional)"
              placeholder="https://meet.google.com/..."
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              icon={<Video className="h-4 w-4" />}
            />

            <Textarea
              label="Agenda (optional)"
              placeholder="What will be covered in this meeting?"
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              loading={createMutation.isPending}
              disabled={!title.trim()}
              icon={<CalendarPlus className="h-4 w-4" />}
            >
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function isToday(iso?: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}