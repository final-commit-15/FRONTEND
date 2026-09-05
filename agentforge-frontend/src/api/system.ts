// src/api/system.ts

import { apiClient } from './client';
import type { SystemHealth } from '@/types/api';

export const systemApi = {
  // Keep your existing method
  getHealth: async (): Promise<SystemHealth> => {
    const { data } = await apiClient.get<SystemHealth>('/health/');
    return data;
  },

  // Additional common methods – adjust endpoint paths to match your backend
  getStatus: async (): Promise<SystemHealth> => {
    const { data } = await apiClient.get<SystemHealth>('/system/status');
    return data;
  },

  getVersion: async (): Promise<{ version: string }> => {
    const { data } = await apiClient.get<{ version: string }>('/system/version');
    return data;
  },

  getMetrics: async (): Promise<Record<string, unknown>> => {
    const { data } = await apiClient.get<Record<string, unknown>>('/system/metrics');
    return data;
  },
};