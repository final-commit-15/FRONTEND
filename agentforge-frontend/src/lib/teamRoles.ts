export interface TeamRole {
  readonly value: string;
  readonly label: string;
  readonly department: string;
}

export const TEAM_MEMBER_ROLES: readonly TeamRole[] = [
  // Cross-cutting mock engineer (seeded by backend, cannot log in)
  { value: 'full_stack_developer', label: 'Full Stack Developer', department: 'Engineering' },
  // Frontend Team
  { value: 'frontend_developer', label: 'Frontend Developer', department: 'Frontend Team' },
  { value: 'ui_ux_designer', label: 'UI/UX Designer', department: 'Frontend Team' },
  { value: 'app_developer', label: 'App Developer', department: 'Frontend Team' },
  // Backend Team
  { value: 'backend_developer', label: 'Backend Developer', department: 'Backend Team' },
  { value: 'system_architect', label: 'System Architect', department: 'Backend Team' },
  { value: 'database_administrator', label: 'Database Administrator', department: 'Backend Team' },
  { value: 'data_engineer', label: 'Data Engineer', department: 'Backend Team' },
  // DevOps Team
  { value: 'devops_engineer', label: 'DevOps Engineer', department: 'DevOps Team' },
  // Cyber Security Team
  { value: 'security_engineer', label: 'Security Engineer', department: 'Cyber Security Team' },
  // QA Team
  { value: 'quality_analyst', label: 'Quality Analyst', department: 'QA Team' },
  { value: 'data_scientist', label: 'Data Scientist', department: 'QA Team' },
  // Testing Team
  { value: 'tester', label: 'Tester', department: 'Testing Team' },
  // Deployment Team
  { value: 'deployment_engineer', label: 'Deployment Engineer', department: 'Deployment Team' },
  { value: 'release_manager', label: 'Release Manager', department: 'Deployment Team' },
] as const;

export const TEAMS = [
  'Frontend Team',
  'Backend Team',
  'DevOps Team',
  'Cyber Security Team',
  'QA Team',
  'Testing Team',
  'Deployment Team',
] as const;

export type TeamName = typeof TEAMS[number];

export type TeamMemberRoleValue = typeof TEAM_MEMBER_ROLES[number]['value'];

export const ROLE_DEPARTMENT_MAP: Record<TeamMemberRoleValue, string> = Object.fromEntries(
  TEAM_MEMBER_ROLES.map(r => [r.value, r.department])
);

export function getDepartmentForRole(role: TeamMemberRoleValue): string {
  return ROLE_DEPARTMENT_MAP[role] || 'Other';
}

export function getRoleLabel(role: TeamMemberRoleValue): string {
  return TEAM_MEMBER_ROLES.find(r => r.value === role)?.label || role;
}

export function getRolesByDepartment(department: string): readonly TeamRole[] {
  return TEAM_MEMBER_ROLES.filter(r => r.department === department);
}