// src/api/permissions.ts

import { apiClient } from './client';
import type { Permission } from '@/types/api';


export const permissionsApi = {
  // List all permissions (optional filter for agent or role)
  list: async (params?: { role?: string; agent_id?: string }): Promise<Permission[]> => {
    const { data } = await apiClient.get<Permission[]>('/permissions/', { params });
    return data;
  },

  // Get a single permission by ID
  get: async (id: string): Promise<Permission> => {
    const { data } = await apiClient.get<Permission>(`/permissions/${id}`);
    return data;
  },

  // Create a new permission (payload excludes `id`)
  create: async (payload: Omit<Permission, 'id'>): Promise<Permission> => {
    const { data } = await apiClient.post<Permission>('/permissions/', payload);
    return data;
  },

  // Update a permission (partial update)
  update: async (id: string, payload: Partial<Permission>): Promise<Permission> => {
    const { data } = await apiClient.put<Permission>(`/permissions/${id}`, payload);
    return data;
  },

  // Delete a permission
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/permissions/${id}`);
  },
};