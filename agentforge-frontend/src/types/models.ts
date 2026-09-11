export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  role: "admin" | "developer" | "operator" | "user" | "viewer";
  is_active: boolean;
  is_verified: boolean;
  avatar_url?: string;
  created_at?: string;
}

// Keep other types as is (Agent, Task, Execution, etc.)

export type UserRole = User['role']; // 'admin' | 'user' | 'viewer'

export type AgentStatus = 'active' | 'inactive';

export interface Agent {
  id: string;
  name: string;
  description?: string;
  type: string;
  agent_type?: string;
  status: AgentStatus;
  capabilities: string[];
  tools?: string[];
  permissions?: string[];
  configuration?: Record<string, any>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  memory?: Record<string, any>;
  execution_limits?: Record<string, any>;
  timeout_seconds?: number;
  retry_policy?: Record<string, any>;
  project_id?: string;
  execution_count: number;
  success_rate: number;
  avg_duration: number;
  last_execution?: string;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface Task {
  id: string;
  title: string;
  name: string; // Deprecated: use title
  description?: string;
  status: TaskStatus;
  assigned_agent_id?: string;
  assigned_agent_name?: string;
  execution_count: number;
  created_at: string;
  updated_at: string;
}

export type ExecutionStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ExecutionStep {
  id: string;
  label: string;
  status: 'completed' | 'active' | 'pending' | 'failed';
  timestamp?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface ExecutionLog {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
}

export interface Execution {
  id: string;
  agent_id: string;
  agent_name: string;
  task_id: string;
  task_name: string;
  status: ExecutionStatus;
  started_at?: string;
  completed_at?: string;
  duration?: number;
  timeline?: ExecutionStep[];
  logs?: ExecutionLog[];
  error?: {
    message: string;
    stack?: string;
  };
  created_at: string;
}