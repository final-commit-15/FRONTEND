export interface TeamRole {
  readonly value: string;
  readonly label: string;
  readonly department: string;
}

export const TEAM_MEMBER_ROLES: readonly TeamRole[] = [
  // Engineering
  { value: 'frontend_web_developer', label: 'Frontend Web Developer', department: 'Engineering' },
  { value: 'backend_web_developer', label: 'Backend Web Developer', department: 'Engineering' },
  { value: 'full_stack_developer', label: 'Full Stack Developer', department: 'Engineering' },
  { value: 'mobile_app_developer', label: 'Mobile App Developer', department: 'Engineering' },
  { value: 'android_developer', label: 'Android Developer', department: 'Engineering' },
  { value: 'ios_developer', label: 'iOS Developer', department: 'Engineering' },
  { value: 'devops_engineer', label: 'DevOps Engineer', department: 'Engineering' },
  { value: 'cloud_engineer', label: 'Cloud Engineer', department: 'Engineering' },
  { value: 'ai_ml_engineer', label: 'AI / ML Engineer', department: 'Engineering' },
  { value: 'data_engineer', label: 'Data Engineer', department: 'Engineering' },
  
  // QA
  { value: 'qa_engineer', label: 'QA Engineer', department: 'QA' },
  { value: 'manual_tester', label: 'Manual Tester', department: 'QA' },
  { value: 'automation_tester', label: 'Automation Tester', department: 'QA' },
  { value: 'performance_tester', label: 'Performance Tester', department: 'QA' },
  
  // Product
  { value: 'project_manager', label: 'Project Manager', department: 'Product' },
  { value: 'product_manager', label: 'Product Manager', department: 'Product' },
  { value: 'scrum_master', label: 'Scrum Master', department: 'Product' },
  { value: 'business_analyst', label: 'Business Analyst', department: 'Product' },
  
  // Design
  { value: 'ui_designer', label: 'UI Designer', department: 'Design' },
  { value: 'ux_designer', label: 'UX Designer', department: 'Design' },
  { value: 'ui_ux_designer', label: 'UI/UX Designer', department: 'Design' },
  { value: 'graphic_designer', label: 'Graphic Designer', department: 'Design' },
  
  // Security
  { value: 'security_engineer', label: 'Security Engineer', department: 'Security' },
  
  // Other
  { value: 'technical_writer', label: 'Technical Writer', department: 'Other' },
  { value: 'support_engineer', label: 'Support Engineer', department: 'Other' },
] as const;

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