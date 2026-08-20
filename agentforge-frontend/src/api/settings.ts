// src/api/settings.ts

import { apiClient } from './client';
import type { Settings, UserPreferences, SecuritySettings, SystemSettings } from '@/types/api';
import type { User } from '@/types/models';

// Re-export for convenience (these now exist in api.ts)
export type { UserPreferences, SecuritySettings, SystemSettings };

export const settingsApi = {
  // ─── Full settings ──────────────────────────────────────────
  get: async (): Promise<Settings> => {
    const { data } = await apiClient.get<Settings>('/settings');
    return data;
  },

  update: async (payload: Partial<Settings>): Promise<Settings> => {
    const { data } = await apiClient.put<Settings>('/settings', payload);
    return data;
  },

  // ─── Profile ────────────────────────────────────────────────
  getProfile: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/settings/profile');
    return data;
  },

  updateProfile: async (payload: Partial<User>): Promise<User> => {
    const { data } = await apiClient.put<User>('/settings/profile', payload);
    return data;
  },

  // ─── Preferences ────────────────────────────────────────────
  getPreferences: async (): Promise<UserPreferences> => {
    const { data } = await apiClient.get<UserPreferences>('/settings/preferences');
    return data;
  },

  updatePreferences: async (payload: Partial<UserPreferences>): Promise<UserPreferences> => {
    const { data } = await apiClient.put<UserPreferences>('/settings/preferences', payload);
    return data;
  },

  // ─── Security ──────────────────────────────────────────────
  getSecurity: async (): Promise<SecuritySettings> => {
    const { data } = await apiClient.get<SecuritySettings>('/settings/security');
    return data;
  },

  updateSecurity: async (payload: Partial<SecuritySettings>): Promise<SecuritySettings> => {
    const { data } = await apiClient.put<SecuritySettings>('/settings/security', payload);
    return data;
  },

  // ─── System ─────────────────────────────────────────────────
  getSystem: async (): Promise<SystemSettings> => {
    const { data } = await apiClient.get<SystemSettings>('/settings/system');
    return data;
  },

  updateSystem: async (payload: Partial<SystemSettings>): Promise<SystemSettings> => {
    const { data } = await apiClient.put<SystemSettings>('/settings/system', payload);
    return data;
  },
};