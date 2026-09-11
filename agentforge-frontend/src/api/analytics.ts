import { apiClient } from './client';
import {
  AnalyticsOverview,
  ExecutionActivityPoint,
  AgentUsagePoint,
  TaskActivityPoint,
  DashboardKPIs,
  SprintProgress,
  TeamWorkload,
  TaskStatusSummary,
  FeatureStatusSummary,
  PendingPRs,
  AIActivitySummary,
  RecentActivity,
  UpcomingDeadline,
  RecentDecision,
  BlockerSummary,
} from '@/types/api';

export const analyticsApi = {
  getOverview: async () => {
    try {
      const { data } = await apiClient.get("/analytics/overview");
      return data;
    } catch {
      return {
        total_agents: 0,
        total_tasks: 0,
        total_executions: 0,
        success_rate: 0,
        active_agents: 0,
      };
    }
  },

  getDashboardKPIs: async (): Promise<DashboardKPIs> => {
    const { data } = await apiClient.get<DashboardKPIs>('/analytics/dashboard/kpis');
    return data;
  },

  getSprintProgress: async (sprintId?: string): Promise<SprintProgress> => {
    const { data } = await apiClient.get<SprintProgress>('/analytics/sprint/progress', {
      params: { sprint_id: sprintId },
    });
    return data;
  },

  getTeamWorkload: async (): Promise<TeamWorkload[]> => {
    const { data } = await apiClient.get<TeamWorkload[]>('/analytics/team/workload');
    return data;
  },

  getTaskStatusSummary: async (): Promise<TaskStatusSummary> => {
    const { data } = await apiClient.get<TaskStatusSummary>('/analytics/tasks/status-summary');
    return data;
  },

  getFeatureStatusSummary: async (): Promise<FeatureStatusSummary> => {
    const { data } = await apiClient.get<FeatureStatusSummary>('/analytics/features/status-summary');
    return data;
  },

  getPendingPRs: async (): Promise<PendingPRs> => {
    const { data } = await apiClient.get<PendingPRs>('/analytics/github/pending-prs');
    return data;
  },

  getAIActivitySummary: async (): Promise<AIActivitySummary> => {
    const { data } = await apiClient.get<AIActivitySummary>('/analytics/ai/summary');
    return data;
  },

  getRecentActivity: async (limit = 10): Promise<RecentActivity[]> => {
    const { data } = await apiClient.get<RecentActivity[]>('/analytics/activity/recent', {
      params: { limit },
    });
    return data;
  },

  getUpcomingDeadlines: async (limit = 5): Promise<UpcomingDeadline[]> => {
    const { data } = await apiClient.get<UpcomingDeadline[]>('/analytics/deadlines/upcoming', {
      params: { limit },
    });
    return data;
  },

  getRecentDecisions: async (limit = 5): Promise<RecentDecision[]> => {
    const { data } = await apiClient.get<RecentDecision[]>('/analytics/decisions/recent', {
      params: { limit },
    });
    return data;
  },

  getBlockerSummary: async (): Promise<BlockerSummary> => {
    const { data } = await apiClient.get<BlockerSummary>('/analytics/blockers/summary');
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