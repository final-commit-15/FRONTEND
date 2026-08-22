// src/types/api.ts
import axios from "axios";
// Re-export domain models for convenience
// Explicit import + re-export
import type { Agent, Execution, Task, User, AgentStatus, TaskStatus, ExecutionStatus } from './models';
export type { Agent, Execution, Task, User, AgentStatus, TaskStatus, ExecutionStatus };

import { useAuthStore } from "@/store/authStore";
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

// ─── Agents ───────────────────────────────────────────────────

export interface AgentListParams {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  type?: string;
  sort?: string;
  limit?: number;
  page?: number;
}

// Using generic PaginatedResponse
export type AgentListResponse = PaginatedResponse<Agent>;

// Payloads for create/update – these match what AgentForm submits
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

// Alias for the existing AgentCreatePayload used in the API client
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

// ─── Analytics & Activity ────────────────────────────────────

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

// ─── Tools & Permissions (auxiliary) ────────────────────────

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

// ─── Settings ────────────────────────────────────────────────

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

// ─── Settings sub‑types ────────────────────────────────────────

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

// ─── Task payloads ────────────────────────────────────────────

export interface TaskCreatePayload {
  name: string;
  description?: string;
  assigned_agent_id?: string;
}

export type TaskUpdatePayload = Partial<TaskCreatePayload>;

export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000/api/v1",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  }
);