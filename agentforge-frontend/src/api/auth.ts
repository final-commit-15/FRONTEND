// src/api/auth.ts

import { apiClient } from './client';
import type { User } from '@/types/models';
import type { LoginRequest, LoginResponse, RegisterRequest } from '@/types/api';

export const authApi = {
  // Get current user (used in useAuth's useQuery)
  me: async (): Promise<User | null> => {
    try {
      const { data } = await apiClient.get<User>('/auth/me');
      return data;
    } catch {
      return null; // Not authenticated
    }
  },

  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return data;
  },

  register: async (payload: RegisterRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/auth/register', payload);
    return data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};