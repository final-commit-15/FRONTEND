// src/types/api.ts
// Re-export domain models for convenience
import type { Agent, Execution, Task, User, AgentStatus, TaskStatus, ExecutionStatus } from './models';
export type { Agent, Execution, Task, User, AgentStatus, TaskStatus, ExecutionStatus };

// ─── Common API infrastructure ───────────────────────────────

export interface ApiError {
  detail?: string;
  message?: string;
  code?: string;
  status?: number;
  fields?: Record<string, string>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// ─── Auth ─────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export type LoginResponse = AuthTokens;
export type RegisterResponse = AuthTokens;

// ─── Email OTP (AgentForge V2) ─────────────────────────────────

export interface OtpSendRequest {
  email: string;
  mode: "register" | "reset";
  /** Explicit purpose ("signup", "login", "forgot_password", "invite");
   *  falls back to the mode mapping (register->signup, reset->forgot_password). */
  purpose?: "signup" | "login" | "forgot_password" | "invite";
  password?: string;
  first_name?: string;
  last_name?: string;
  organization_name?: string;
  organization_logo?: string;
  phone?: string;
}

export interface OtpSendResponse {
  success: boolean;
  message: string;
  email: string;
  mode: "register" | "reset";
  purpose?: string;
  errorType?: string;
  /** Only true when the backend confirmed the SMTP server accepted the email. */
  smtpAccepted?: boolean;
  expiresIn?: number;
  otpLength?: number;
  resendAfter?: number;
  retryAfter?: number;
}

export interface OtpVerifyRequest {
  email: string;
  token: string;
  mode: "register" | "reset";
  password?: string;
  first_name?: string;
  last_name?: string;
  organization_name?: string;
  organization_logo?: string;
  phone?: string;
}

export interface ResetPasswordRequest {
  reset_token: string;
  new_password: string;
  confirm_password: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface WorkspaceBrief {
  id: string;
  name: string;
  description?: string | null;
  owner_id: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
  workspace?: WorkspaceBrief | null;
}

export type OtpErrorMessageType =
  | 'INVALID_FORMAT'
  | 'INVALID_OTP'
  | 'OTP_EXPIRED'
  | 'OTP_LOCKED';

export interface OtpVerifyResponse {
  success: boolean;
  message: string;
  errorType?: OtpErrorMessageType | string;
  user?: User | null;
  workspace?: WorkspaceBrief | null;
  session?: {
    access_token: string;
    refresh_token: string;
    token_type: string;
  } | null;
  // Backward-compat top-level tokens (present ONLY on login-mode success)
  access_token?: string;
  refresh_token?: string;
  token_type?: string;
  // Issued after a successful password-reset OTP verification (mode="reset")
  reset_token?: string;
}

// ─── Agents ───────────────────────────────────────────────────

export interface AgentListParams {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  type?: string;
  sort?: string;
  limit?: number;
  page?: number;
}

export type AgentListResponse = PaginatedResponse<Agent>;

export interface CreateAgentRequest {
  name: string;
  description?: string;
  type: string;
  status: 'active' | 'inactive';
  capabilities: string[];
  tools?: string[];
  permissions?: string[];
  configuration?: Record<string, unknown>;
}

export type UpdateAgentRequest = Partial<CreateAgentRequest>;

export type AgentCreatePayload = CreateAgentRequest;
export type AgentUpdatePayload = UpdateAgentRequest;

// ─── Tasks ────────────────────────────────────────────────────

export interface TaskListParams {
  search?: string;
  status?: string;
  agent_id?: string;
  sort?: string;
  limit?: number;
  page?: number;
}

export type TaskListResponse = PaginatedResponse<Task>;

export interface CreateTaskRequest {
  name: string;
  description?: string;
  assigned_agent_id?: string;
}

export type UpdateTaskRequest = Partial<CreateTaskRequest>;

// ─── Executions ──────────────────────────────────────────────

export interface ExecutionListParams {
  search?: string;
  status?: string;
  agent_id?: string;
  task_id?: string;
  sort?: string;
  limit?: number;
  page?: number;
}

export type ExecutionListResponse = PaginatedResponse<Execution>;

export interface ExecuteAgentRequest {
  agent_id: string;
  task_id: string;
  input?: Record<string, unknown>;
}

// ─── Analytics & Activity ─────────────────────────────────────

export interface AnalyticsOverview {
  total_agents: number;
  active_agents: number;
  total_executions: number;
  success_rate: number;
  agents_change: number;
  active_agents_change: number;
  executions_change: number;
  success_rate_change: number;
}

export interface ExecutionActivityPoint {
  timestamp: string;
  count: number;
}

export interface AgentUsagePoint {
  agent_id: string;
  agent_name: string;
  executions: number;
  success_rate: number;
  avg_duration: number;
}

export interface TaskActivityPoint {
  date: string;
  count: number;
}

export interface ActivityEvent {
  id: string;
  type: string;
  description: string;
  user_name: string;
  timestamp: string;
  related_entity?: {
    type: string;
    id: string;
    name: string;
  };
}

export type ActivityListResponse = PaginatedResponse<ActivityEvent>;

// ─── System ──────────────────────────────────────────────────

export interface SystemHealth {
  api_status: 'healthy' | 'degraded' | 'down';
  worker_status: 'healthy' | 'degraded' | 'down';
  redis_status: 'healthy' | 'degraded' | 'down';
  database_status: 'healthy' | 'degraded' | 'down';
  ai_status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
}

// ─── Tools & Permissions (auxiliary) ─────────────────────────

export interface Tool {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  category: string;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  granted: boolean;
  associated_agent?: string;
}

// ─── Settings ──────────────────────────────────────────────────

export interface Settings {
  user: User;
  preferences: {
    theme: 'dark' | 'light';
    notifications_enabled: boolean;
    email_notifications: boolean;
    default_agent_timeout: number;
  };
  security: {
    two_factor_enabled: boolean;
    last_password_change: string;
  };
  system: {
    max_concurrent_executions: number;
    log_level: string;
    retention_days: number;
  };
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  notifications_enabled: boolean;
  email_notifications: boolean;
  default_agent_timeout: number;
}

export interface SecuritySettings {
  two_factor_enabled: boolean;
  last_password_change: string;
}

export interface SystemSettings {
  max_concurrent_executions: number;
  log_level: string;
  retention_days: number;
}

// ─── Task payloads ─────────────────────────────────────────────

export interface TaskCreatePayload {
  title: string;
  description?: string;
  assigned_agent_id?: string;
}

export type TaskUpdatePayload = Partial<
  TaskCreatePayload & { deadline?: string }
>;

// ─── Team Members & Invitations ────────────────────────────────

export type TeamMemberRole = 
  // Engineering
  | 'frontend_developer'
  | 'backend_developer'
  | 'system_architect'
  | 'app_developer'
  | 'database_administrator'
  | 'devops_engineer'
  | 'data_scientist'
  | 'data_engineer'
  // QA
  | 'tester'
  | 'quality_analyst'
  // Design
  | 'ui_ux_designer'
  // Security
  | 'security_engineer';

export type TeamMemberStatus = 'invited' | 'accepted' | 'active' | 'offline';

export interface TeamMemberBase {
  email: string;
  full_name: string;
  role: TeamMemberRole;
  department?: string;
  avatar_url?: string;
  github_username?: string;
}

export type TeamMemberCreate = TeamMemberBase;

export interface TeamMemberUpdate {
  full_name?: string;
  role?: TeamMemberRole;
  department?: string;
  avatar_url?: string;
  github_username?: string;
  status?: TeamMemberStatus;
}

export interface TeamMemberOut extends TeamMemberBase {
  id: string;
  workspace_id: string;
  user_id?: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  github_username?: string;
  invited_at: string;
  accepted_at?: string;
  joined_at?: string;
}

export interface TeamMemberInvite {
  email: string;
  full_name: string;
  role: TeamMemberRole;
  department?: string;
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface InvitationOut {
  id: string;
  workspace_id: string;
  email: string;
  full_name: string;
  role: TeamMemberRole;
  department: string;
  invited_by: string;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
}

// ─── Requirements ────────────────────────────────────────────

export type RequirementSource = 'pdf' | 'docx' | 'txt' | 'markdown' | 'figma_url' | 'website_url' | 'github_repo_url' | 'screenshot';

export type RequirementStatus = 'uploaded' | 'processing' | 'processed' | 'failed' | 'archived';

export interface RequirementBase {
  title: string;
  description?: string;
  source: RequirementSource;
  source_url?: string;
}

export type RequirementCreate = RequirementBase;

export interface RequirementUpdate {
  title?: string;
  description?: string;
  status?: RequirementStatus;
}

export interface RequirementOut extends RequirementBase {
  id: string;
  workspace_id: string;
  uploaded_by?: string;
  status: RequirementStatus;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  extracted_text?: string;
  ai_summary?: string;
  ai_extracted_features: Array<Record<string, any>>;
  created_at: string;
  updated_at: string;
}

export type RequirementListResponse = PaginatedResponse<RequirementOut>;

// ─── Features ────────────────────────────────────────────────

export type FeatureStatus = 'draft' | 'planned' | 'in_progress' | 'in_review' | 'approved' | 'rejected' | 'completed' | 'archived';
export type FeaturePriority = 'low' | 'medium' | 'high' | 'critical';

export interface FeatureBase {
  title: string;
  description?: string;
  epic?: string;
  user_story?: string;
  acceptance_criteria: string[];
  technical_notes?: string;
  priority: FeaturePriority;
  estimated_complexity?: string;
  estimated_story_points?: number;
  parent_feature_id?: string;
}

export interface FeatureCreate extends FeatureBase {
  requirement_id?: string;
  assignee_id?: string;
}

export interface FeatureUpdate {
  title?: string;
  description?: string;
  epic?: string;
  user_story?: string;
  acceptance_criteria?: string[];
  technical_notes?: string;
  status?: FeatureStatus;
  priority?: FeaturePriority;
  estimated_complexity?: string;
  estimated_story_points?: number;
  actual_story_points?: number;
  assignee_id?: string;
  parent_feature_id?: string;
}

export interface FeatureOut extends FeatureBase {
  id: string;
  workspace_id: string;
  requirement_id?: string;
  assignee_id?: string;
  created_by: string;
  feature_key: string;
  status: FeatureStatus;
  priority: FeaturePriority;
  estimated_story_points?: number;
  actual_story_points?: number;
  parent_feature_id?: string;
  created_at: string;
  updated_at: string;
}

export type FeatureListResponse = PaginatedResponse<FeatureOut>;

// ─── Sprints ────────────────────────────────────────────────

export type SprintStatus = 'planned' | 'active' | 'paused' | 'completed' | 'archived';

export interface SprintBase {
  name: string;
  goal?: string;
  start_date?: string;
  end_date?: string;
}

export type SprintCreate = SprintBase;

export interface SprintUpdate {
  name?: string;
  goal?: string;
  start_date?: string;
  end_date?: string;
  status?: SprintStatus;
  story_points_planned?: number;
  story_points_completed?: number;
}

export interface SprintOut extends SprintBase {
  id: string;
  workspace_id: string;
  status: SprintStatus;
  story_points_planned: number;
  story_points_completed: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type SprintListResponse = PaginatedResponse<SprintOut>;

export interface SprintAnalytics {
  sprint_id: string;
  completion_percentage: number;
  total_story_points: number;
  completed_story_points: number;
  velocity: number;
  completed_tasks: number;
  total_tasks: number;
  bugs_discovered: number;
  bugs_resolved: number;
  prs_reviewed: number;
  team_workload: Record<string, number>;
}

// ─── Sprint Notes ────────────────────────────────────────────

export type SprintNoteAuthorType = 'manager' | 'ai_agent';

export interface SprintNoteBase {
  date: string;
  author_type: SprintNoteAuthorType;
  completed_work?: string;
  in_progress?: string;
  blockers?: string;
  decisions?: string;
  notes?: string;
  pinned?: boolean;
}

export interface SprintNoteCreate extends SprintNoteBase {
  sprint_id: string;
  author_id?: string;
}

export interface SprintNoteUpdate {
  completed_work?: string;
  in_progress?: string;
  blockers?: string;
  decisions?: string;
  notes?: string;
}

export interface SprintNoteOut extends SprintNoteBase {
  id: string;
  sprint_id: string;
  author_type: SprintNoteAuthorType;
  author_id?: string;
  ai_generated: boolean;
  ai_source_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type SprintNoteListResponse = PaginatedResponse<SprintNoteOut>;

export interface SprintNoteTaskLinkCreate {
  sprint_note_id: string;
  task_id: string;
}

export interface SprintNoteFeatureLinkCreate {
  sprint_note_id: string;
  feature_id: string;
}

// ─── Blockers ────────────────────────────────────────────────

export type BlockerStatus = 'open' | 'in_progress' | 'resolved' | 'wont_fix';
export type BlockerPriority = 'low' | 'medium' | 'high' | 'critical';

export interface BlockerBase {
  title: string;
  description?: string;
  priority: BlockerPriority;
}

export interface BlockerCreate extends BlockerBase {
  sprint_id?: string;
  owner_id: string;
  related_feature_id?: string;
  related_task_id?: string;
}

export interface BlockerUpdate {
  title?: string;
  description?: string;
  priority?: BlockerPriority;
  status?: BlockerStatus;
  owner_id?: string;
  related_feature_id?: string;
  related_task_id?: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface BlockerOut extends BlockerBase {
  id: string;
  workspace_id: string;
  sprint_id?: string;
  owner_id: string;
  status: BlockerStatus;
  priority: BlockerPriority;
  related_feature_id?: string;
  related_task_id?: string;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
}

// ─── Decisions ────────────────────────────────────────────────

export interface DecisionBase {
  title: string;
  description: string;
  reason: string;
  impact?: string;
}

export interface DecisionCreate extends DecisionBase {
  sprint_id?: string;
}

export interface DecisionOut extends DecisionBase {
  id: string;
  workspace_id: string;
  sprint_id?: string;
  date: string;
  made_by: string;
  created_at: string;
  updated_at: string;
}

// ─── Dashboard Types ────────────────────────────────────────────

export interface DashboardKPIs {
  active_projects: number;
  active_sprint: { id: string; name: string; completion: number } | null;
  sprint_completion: number;
  story_points_total: number;
  story_points_completed: number;
  features_completed: number;
  tasks_completed: number;
  tasks_pending_review: number;
  open_blockers: number;
  pending_qa: number;
  kb_documents: number;
}

export interface SprintProgress {
  sprint_id: string;
  sprint_name: string;
  completion: number;
  story_points_total: number;
  story_points_completed: number;
  days_remaining: number;
  status: 'healthy' | 'at_risk' | 'delayed';
  velocity: number;
  burndown: { date: string; remaining: number; ideal: number }[];
}

export interface TeamWorkload {
  member_id: string;
  member_name: string;
  avatar_url?: string;
  department: string;
  assigned_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  workload_percentage: number;
  status: 'underloaded' | 'balanced' | 'overloaded';
}

export interface TaskStatusSummary {
  pending: number;
  in_progress: number;
  in_review: number;
  completed: number;
  blocked: number;
  total: number;
}

export interface FeatureStatusSummary {
  planned: number;
  in_progress: number;
  in_review: number;
  completed: number;
  archived: number;
  total: number;
}

export interface PendingPRs {
  total: number;
  by_status: Record<string, number>;
  by_repository: Record<string, number>;
  prs: {
    id: string;
    number: number;
    title: string;
    repository: string;
    branch: string;
    author: string;
    feature_id?: string;
    task_id?: string;
    ai_recommendation?: 'approve' | 'reject' | 'needs_changes';
    status: string;
    updated_at: string;
  }[];
}

export interface AIActivitySummary {
  total_runs: number;
  successful: number;
  failed: number;
  agents_active: number;
  last_run: string;
  summary: string;
  top_agents: { name: string; runs: number; success_rate: number }[];
}

export interface RecentActivity {
  id: string;
  type: 'requirement' | 'feature' | 'task' | 'sprint' | 'note' | 'blocker' | 'decision' | 'pr' | 'qa';
  title: string;
  description?: string;
  user_name: string;
  user_avatar?: string;
  timestamp: string;
  entity_id?: string;
  entity_type?: string;
}

export interface UpcomingDeadline {
  id: string;
  type: 'sprint' | 'feature' | 'task' | 'review';
  title: string;
  due_date: string;
  days_remaining: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface RecentDecision {
  id: string;
  title: string;
  description: string;
  made_by: string;
  date: string;
  sprint_name?: string;
}

export interface BlockerSummary {
  total: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  oldest_open: { id: string; title: string; days_open: number } | null;
}