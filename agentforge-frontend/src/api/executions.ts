// src/api/executions.ts

import { apiClient } from './client';
import type { Execution } from '@/types/models';
import type {
  ExecutionListParams,
  ExecutionListResponse,
  ExecuteAgentRequest,
} from '@/types/api';

// Re-export payload type for convenience
export type ExecutionCreatePayload = ExecuteAgentRequest;

export const executionsApi = {
  list: async (params: ExecutionListParams = {}): Promise<ExecutionListResponse> => {
    const { data } = await apiClient.get<ExecutionListResponse>('/executions', { params });
    return data;
  },

  get: async (id: string): Promise<Execution> => {
    const { data } = await apiClient.get<Execution>(`/executions/${id}`);
    return data;
  },

  // Matches your existing create signature: (agentId, taskId)
  create: async (agentId: string, taskId: string): Promise<Execution> => {
    const payload: ExecuteAgentRequest = { agent_id: agentId, task_id: taskId };
    const { data } = await apiClient.post<Execution>('/executions', payload);
    return data;
  },

  retry: async (id: string): Promise<Execution> => {
    const { data } = await apiClient.post<Execution>(`/executions/${id}/retry`);
    return data;
  },

  cancel: async (id: string): Promise<Execution> => {
    const { data } = await apiClient.post<Execution>(`/executions/${id}/cancel`);
    return data;
  },
};