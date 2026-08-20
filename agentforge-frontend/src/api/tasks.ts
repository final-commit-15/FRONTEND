// src/api/tasks.ts

import { apiClient } from './client';
import type { Task } from '@/types/models';
import type {
  TaskListParams,
  TaskListResponse,
  TaskCreatePayload,
  TaskUpdatePayload,
} from '@/types/api';

// Re-export payload types for convenience (now exist in api.ts)
export type { TaskCreatePayload, TaskUpdatePayload };

export const tasksApi = {
  list: async (params: TaskListParams = {}): Promise<TaskListResponse> => {
    const { data } = await apiClient.get<TaskListResponse>('/tasks', { params });
    return data;
  },

  get: async (id: string): Promise<Task> => {
    const { data } = await apiClient.get<Task>(`/tasks/${id}`);
    return data;
  },

  create: async (payload: TaskCreatePayload): Promise<Task> => {
    const { data } = await apiClient.post<Task>('/tasks', payload);
    return data;
  },

  update: async (id: string, payload: TaskUpdatePayload): Promise<Task> => {
    const { data } = await apiClient.put<Task>(`/tasks/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },
};