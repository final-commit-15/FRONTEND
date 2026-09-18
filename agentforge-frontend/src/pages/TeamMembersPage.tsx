import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Mail, UserPlus, UserCheck, UserX, MoreHorizontal, Shield, Code, Layout, Smartphone, Server, Database, Zap, Monitor, Settings, AlertTriangle, CheckCircle2, X, Loader2, Target, Brain, Trash2, Users, Globe, GraduationCap, PenTool, Laptop, HardDrive, Cpu, Cloud, Database as DatabaseIcon, GitBranch, Briefcase, ClipboardList, Wrench, BarChart2, Palette, Lock, FileText, Headphones, ChevronDown } from 'lucide-react';
import { Suspense } from 'react';

import { teamMembersApi } from '@/api/team_members';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TeamRole, TEAM_MEMBER_ROLES, TEAMS, getDepartmentForRole, getRoleLabel } from '@/lib/teamRoles';

const ROLE_ICONS: Record<string, React.ElementType> = {
  frontend_developer: Layout,
  backend_developer: Server,
  system_architect: Shield,
  app_developer: Smartphone,
  database_administrator: DatabaseIcon,
  devops_engineer: Settings,
  data_scientist: Brain,
  data_engineer: DatabaseIcon,
  tester: AlertTriangle,
  quality_analyst: CheckCircle2,
  ui_ux_designer: Palette,
  security_engineer: Lock,
  full_stack_developer: Code,
};

const DEPARTMENT_COLORS: Record<string, string> = {
  Engineering: 'bg-blue-500/20 text-blue-400',
  QA: 'bg-yellow-500/20 text-yellow-400',
  Product: 'bg-purple-500/20 text-purple-400',
  Design: 'bg-pink-500/20 text-pink-400',
  Security: 'bg-red-500/20 text-red-400',
  Other: 'bg-gray-500/20 text-gray-400',
};

const STATUS_COLORS: Record<string, string> = {
  invited: 'bg-gray-500/20 text-gray-400',
  accepted: 'bg-blue-500/20 text-blue-400',
  active: 'bg-green-500/20 text-green-400',
  offline: 'bg-gray-500/20 text-gray-400',
};

function InvitationsList({ 
  acceptInvitationMutation, 
  revokeInvitationMutation 
}: { 
  acceptInvitationMutation: any;
  revokeInvitationMutation: any;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['team-member-invitations'],
    queryFn: () => teamMembersApi.listInvitations(),
  });

  if (isLoading) return <Skeleton variant="card" className="h-32" />;

  const invitations = data || [];

  if (invitations.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        <Mail className="mx-auto h-12 w-12 text-text-muted/50 mb-4" />
        <p>No pending invitations</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invitations.map(invitation => (
        <Card key={invitation.id} className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-brand-primary" />
            </div>
            <div>
              <p className="font-medium text-text-heading">{invitation.full_name}</p>
              <p className="text-sm text-text-muted">{invitation.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={DEPARTMENT_COLORS[invitation.department] || 'bg-gray-500/20 text-gray-400'}>
              {invitation.department}
            </Badge>
            <Badge className="text-xs text-amber-500 border-amber-500/50 bg-amber-500/10">Pending</Badge>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => acceptInvitationMutation.mutate(invitation.id)}>
                <UserCheck className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="text-error-600 hover:text-error-600" onClick={() => revokeInvitationMutation.mutate(invitation.id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function MemberCard({ member, removeMutation }: { member: any; removeMutation: any }) {
  const department = member.department || 'Other';
  const deptColor = DEPARTMENT_COLORS[department] || 'bg-gray-500/20 text-gray-400';
  const statusColor = STATUS_COLORS[member.status] || 'bg-gray-500/20 text-gray-400';
  const RoleIcon = ROLE_ICONS[member.role] || Code;
  const isMock = member.member_type === 'mock_user';

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const roleLabel = getRoleLabel(member.role);
  const roleDisplay = isMock ? roleLabel.toUpperCase() : roleLabel;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="w-12 h-12">
              <AvatarImage src={member.avatar_url} alt={member.full_name} />
              <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-text-heading truncate">{member.full_name}</h3>
                {isMock && (
                  <Badge variant="error" className="text-[10px]">
                    MOCK USER
                  </Badge>
                )}
              </div>
              <p className="text-sm text-text-muted truncate">{member.email}</p>
              {member.employment_id && (
                <p className="text-xs text-text-muted truncate">ID: {member.employment_id}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-canvas-border">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={deptColor}>
              <RoleIcon className="h-3 w-3 mr-1" />
              {roleDisplay}
            </Badge>
            <Badge className="text-[10px] bg-gray-500/10 text-gray-600">
              {department}
            </Badge>
            <Badge className={STATUS_COLORS[member.status] || 'bg-gray-500/20 text-gray-400'}>
              {member.status}
            </Badge>
            {isMock && (
              <Badge variant="error" className="text-[10px]">
                MOCK USER
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>{member.github_username ? `@${member.github_username}` : 'No GitHub'}</span>
          <span>{member.joined_at ? `Joined ${format(new Date(member.joined_at), 'MMM d, yyyy')}` : member.invited_at ? `Invited ${format(new Date(member.invited_at), 'MMM d, yyyy')}` : 'Pending'}</span>
        </div>
      </div>
    </Card>
  );
}

export function TeamMembersPage() {
  const { addToast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [openTeam, setOpenTeam] = useState<string | null>(null);
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    full_name: '',
    employment_id: '',
    team: 'Frontend Team',
    role: 'frontend_developer' as any,
    department: 'Frontend Team',
    github_username: '',
    avatar_url: '',
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => teamMembersApi.list(),
    retry: false,
  });

  const mockMembers = (data || []).filter((m: any) => m.member_type === 'mock_user');

  const inviteMutation = useMutation({
    mutationFn: (payload: any) => teamMembersApi.createInvitation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      addToast({ type: 'success', title: 'Invitation sent', description: 'Invitation sent successfully.' });
      setShowInviteDialog(false);
      setInviteFormData({ email: '', full_name: '', employment_id: '', team: 'Frontend Team', role: 'frontend_developer', department: 'Frontend Team', github_username: '', avatar_url: '' });
    },
    onError: (error: any) => {
      addToast({ type: 'error', title: 'Failed to send invitation', description: error.message });
    },
  });

  const acceptInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => teamMembersApi.acceptInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      addToast({ type: 'success', title: 'Invitation accepted', description: 'You have joined the workspace.' });
    },
    onError: (error: any) => {
      addToast({ type: 'error', title: 'Failed to accept invitation', description: error.message });
    },
  });

  const revokeInvitationMutation = useMutation({
    mutationFn: (invitationId: string) => teamMembersApi.revokeInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      addToast({ type: 'success', title: 'Invitation revoked', description: 'Invitation has been revoked.' });
    },
    onError: (error: any) => {
      addToast({ type: 'error', title: 'Failed to revoke', description: error.message });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => teamMembersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      addToast({ type: 'success', title: 'Member updated', description: 'Member details updated.' });
    },
    onError: (error: any) => {
      addToast({ type: 'error', title: 'Failed to update member', description: error.message });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => teamMembersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      addToast({ type: 'success', title: 'Member removed', description: 'Team member removed from workspace.' });
    },
    onError: (error: any) => {
      addToast({ type: 'error', title: 'Failed to remove member', description: error.message });
    },
  });

if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton variant="title" className="w-56" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="card" className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const members = data || [];
  const filteredMembers = members.filter((m: any) =>
    String(m.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    String(m.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    String(m.role ?? '').toLowerCase().includes(search.toLowerCase()) ||
    String(m.employment_id ?? m.employmentId ?? '').toLowerCase().includes(search.toLowerCase()) ||
    String(m.team ?? m.department ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleChange = (role: string) => {
    const department = getDepartmentForRole(role as any);
    setInviteFormData(prev => ({ ...prev, role, department, team: department }));
  };

  const handleTeamChange = (team: string) => {
    const firstRole = TEAM_MEMBER_ROLES.find(r => r.department === team);
    setInviteFormData(prev => ({
      ...prev,
      team,
      department: team,
      role: firstRole ? firstRole.value : prev.role,
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text-heading">Team Members</h1>
          <p className="text-text-body mt-1">Manage your workspace team members and invitations.</p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)} icon={<UserPlus size={18} />}>
          Invite Member
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Input placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
        </div>
      </div>

      {/* Invitations Section */}
      <div className="space-y-4">
        <h2 className="font-semibold text-text-heading">Pending Invitations</h2>
        <Suspense fallback={<Skeleton variant="card" className="h-32" />}>
          <InvitationsList 
            acceptInvitationMutation={acceptInvitationMutation} 
            revokeInvitationMutation={revokeInvitationMutation} 
          />
        </Suspense>
      </div>

      <div className="pt-8">
        <h2 className="font-semibold text-text-heading mb-4">Teams</h2>

        {(() => {
          const mockMembersList = filteredMembers.filter((m: any) => m.member_type === 'mock_user');
          if (mockMembersList.length === 0) return null;
          return (
            <div className="space-y-4 pb-8">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-text-heading">Mock Members</h2>
                <Badge variant="error" className="text-xs">MOCK USER</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {mockMembersList.map((member: any) => (
                  <MemberCard key={member.id} member={member} removeMutation={removeMutation} />
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      <div className="pt-8">
        <h2 className="font-semibold text-text-heading mb-4">Teams</h2>

        {filteredMembers.length === 0 ? (
          <EmptyState
            title={search ? 'No matching members' : 'No team members yet'}
            description={search ? 'Try adjusting your search' : 'Invite your first team member to get started'}
            action={<Button onClick={() => setShowInviteDialog(true)} icon={<UserPlus size={18} />}>Invite Member</Button>}
          />
        ) : (
          <div className="space-y-4">
            {(() => {
              const teamOrder: string[] = [...(TEAMS as readonly string[])];
              const activeTeam = openTeam ?? teamOrder.find((t) => filteredMembers.some((m: any) => String(m.team ?? m.department ?? '') === t)) ?? teamOrder[0];
              return teamOrder.map((dept) => {
                const deptMembers = filteredMembers.filter((m: any) => String(m.team ?? m.department ?? '') === dept);
                const isOpen = activeTeam === dept;
                return (
                  <div key={dept} className="rounded-2xl border border-canvas-border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenTeam(isOpen ? null : dept)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-canvas-surface/60 hover:bg-canvas-surface transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span className="flex items-center gap-2">
                        <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                        <span className="font-semibold text-text-heading">{dept}</span>
                      </span>
                      <Badge variant="default" className="text-xs">{deptMembers.length} members</Badge>
                    </button>
                    {isOpen && (
                      <div className="p-4">
                        {deptMembers.length === 0 ? (
                          <p className="text-sm text-text-muted">No members in this team yet. Invite by email + employment ID.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {deptMembers.map((member: any) => (
                              <MemberCard key={member.id} member={member} removeMutation={removeMutation} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>Send an invitation to join your workspace.</DialogDescription>
          </DialogHeader>
          <form id="invite-member-form" onSubmit={(e) => { e.preventDefault(); inviteMutation.mutate(inviteFormData); }} className="space-y-4">
            <div className="space-y-2">
              <label className="label">Email ID *</label>
              <Input type="email" placeholder="colleague@company.com" value={inviteFormData.email} onChange={(e) => setInviteFormData({...inviteFormData, email: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label">Full Name</label>
                <Input placeholder="John Doe" value={inviteFormData.full_name} onChange={(e) => setInviteFormData({...inviteFormData, full_name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <label className="label">Employment ID *</label>
                <Input placeholder="EMP-1024" value={inviteFormData.employment_id} onChange={(e) => setInviteFormData({...inviteFormData, employment_id: e.target.value})} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label">Team *</label>
                <div className="relative">
                  <select
                    value={inviteFormData.team}
                    onChange={(e) => handleTeamChange(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-canvas-border bg-canvas-surface px-4 py-2.5 pr-10 text-sm text-text-heading shadow-sm transition-all duration-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                  >
                    {(TEAMS as readonly string[]).map((team) => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="label">Role</label>
                <div className="relative">
                  <select
                    value={inviteFormData.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-canvas-border bg-canvas-surface px-4 py-2.5 pr-10 text-sm text-text-heading shadow-sm transition-all duration-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                  >
                    {TEAM_MEMBER_ROLES.filter((role) => role.department === inviteFormData.team).map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label">GitHub Username (optional)</label>
                <Input placeholder="githubusername" value={inviteFormData.github_username} onChange={(e) => setInviteFormData({...inviteFormData, github_username: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="label">Avatar URL (optional)</label>
                <Input placeholder="https://..." value={inviteFormData.avatar_url} onChange={(e) => setInviteFormData({...inviteFormData, avatar_url: e.target.value})} />
              </div>
            </div>
          </form>
          <DialogFooter className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
            <Button type="submit" form="invite-member-form" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}