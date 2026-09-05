// src/api/tools.ts

import { apiClient } from './client';
import type { Tool } from '@/types/api';


export const toolsApi = {
  // List tools with optional filtering (category, status)
  list: async (params?: { category?: string; status?: string }): Promise<Tool[]> => {
    const { data } = await apiClient.get<Tool[]>('/tools', { params });
    return data;
  },

  // Get a single tool by ID
  get: async (id: string): Promise<Tool> => {
    const { data } = await apiClient.get<Tool>(`/tools/${id}`);
    return data;
  },

  // Create a new tool (payload excludes `id` since it's server-generated)
  create: async (payload: Omit<Tool, 'id'>): Promise<Tool> => {
    const { data } = await apiClient.post<Tool>('/tools', payload);
    return data;
  },

  // Update an existing tool (partial updates allowed)
  update: async (id: string, payload: Partial<Tool>): Promise<Tool> => {
    const { data } = await apiClient.put<Tool>(`/tools/${id}`, payload);
    return data;
  },

  // Delete a tool
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tools/${id}`);
  },
};