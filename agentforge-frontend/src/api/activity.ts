// src/api/activity.ts

import { apiClient } from './client';
import type { ActivityListResponse } from '@/types/api';

export const activityApi = {
  list: async (params?: { limit?: number; page?: number }): Promise<ActivityListResponse> => {
    const { data } = await apiClient.get<ActivityListResponse>('/activity', { params });
    return data;
  },

  // Optional: fetch recent activity (used in dashboard widgets)
  recent: async (limit = 10): Promise<ActivityListResponse> => {
    const { data } = await apiClient.get<ActivityListResponse>('/activity/recent', {
      params: { limit },
    });
    return data;
  },
};