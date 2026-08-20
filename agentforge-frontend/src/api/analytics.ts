import { apiClient } from './client';
import {
  AnalyticsOverview,
  ExecutionActivityPoint,
  AgentUsagePoint,
  TaskActivityPoint,
} from '@/types/api';

export const analyticsApi = {
  getOverview: async (): Promise<AnalyticsOverview> => {
    const { data } = await apiClient.get<AnalyticsOverview>('/analytics/overview');
    return data;
  },

  getExecutionActivity: async (range: '24h' | '7d' | '30d' | '90d' = '7d'): Promise<ExecutionActivityPoint[]> => {
    const { data } = await apiClient.get<ExecutionActivityPoint[]>('/analytics/executions', {
      params: { range },
    });
    return data;
  },

  getAgentUsage: async (range: '24h' | '7d' | '30d' | '90d' = '7d'): Promise<AgentUsagePoint[]> => {
    const { data } = await apiClient.get<AgentUsagePoint[]>('/analytics/agents', {
      params: { range },
    });
    return data;
  },

  getTasksOverTime: async (range: '24h' | '7d' | '30d' | '90d' = '7d'): Promise<TaskActivityPoint[]> => {
    const { data } = await apiClient.get<TaskActivityPoint[]>('/analytics/tasks', {
      params: { range },
    });
    return data;
  },

  getAgentPerformanceComparison: async (range: '24h' | '7d' | '30d' | '90d' = '7d'): Promise<AgentUsagePoint[]> => {
    const { data } = await apiClient.get<AgentUsagePoint[]>('/analytics/performance', {
      params: { range },
    });
    return data;
  },
};