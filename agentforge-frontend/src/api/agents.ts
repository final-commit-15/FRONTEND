// src/api/agents.ts

import { apiClient } from './client';
import type {
  Agent,
  AgentListParams,
  AgentListResponse,
  AgentCreatePayload,
  AgentUpdatePayload,
} from '@/types/api';
import type { Execution } from '@/types/models';

// Re‑export payload types so `AgentForm` can import them from this module
export type { AgentCreatePayload, AgentUpdatePayload };

export const agentsApi = {
  list: async (params: AgentListParams = {}): Promise<AgentListResponse> => {
    const { data } = await apiClient.get<AgentListResponse>('/agents', { params });
    return data;
  },

  get: async (id: string): Promise<Agent> => {
    const { data } = await apiClient.get<Agent>(`/agents/${id}`);
    return data;
  },

  create: async (payload: AgentCreatePayload): Promise<Agent> => {
    const { data } = await apiClient.post<Agent>('/agents', payload);
    return data;
  },

  update: async (id: string, payload: AgentUpdatePayload): Promise<Agent> => {
    const { data } = await apiClient.put<Agent>(`/agents/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/agents/${id}`);
  },

  execute: async (id: string, taskId: string): Promise<Execution> => {
    const { data } = await apiClient.post<Execution>(`/agents/${id}/execute`, { task_id: taskId });
    return data;
  },

  toggleStatus: async (id: string, status: 'active' | 'inactive'): Promise<Agent> => {
    const { data } = await apiClient.put<Agent>(`/agents/${id}`, { status });
    return data;
  },
};