// src/api/meetings.ts

import { apiClient } from './client';

export type MeetingType =
  | 'sprint_planning'
  | 'daily_standup'
  | 'sprint_review'
  | 'sprint_retrospective'
  | 'client_call'
  | 'other';

export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Meeting {
  id: string;
  title: string;
  meeting_type: MeetingType;
  status: MeetingStatus;
  description?: string | null;
  starts_at: string;
  ends_at?: string | null;
  duration_minutes?: number | null;
  timezone?: string | null;
  location?: string | null;
  meeting_link?: string | null;
  agenda?: string | null;
  attendees: string[];
  notes?: string | null;
  workspace_id: string;
  project_id?: string | null;
  sprint_id?: string | null;
  created_by: string;
  created_at: string;
}

export interface MeetingCreatePayload {
  title: string;
  meeting_type: MeetingType;
  description?: string;
  starts_at: string;
  ends_at?: string;
  duration_minutes?: number;
  timezone?: string;
  location?: string;
  meeting_link?: string;
  agenda?: string;
  attendees?: string[];
  project_id?: string;
  sprint_id?: string;
}

export type MeetingUpdatePayload = Partial<Omit<MeetingCreatePayload, 'title'> & { status?: MeetingStatus }>;

export const meetingsApi = {
  list: async (params?: { project_id?: string; upcoming_only?: boolean }): Promise<Meeting[]> => {
    const { data } = await apiClient.get<Meeting[]>('/meetings', { params });
    return data;
  },

  get: async (id: string): Promise<Meeting> => {
    const { data } = await apiClient.get<Meeting>(`/meetings/${id}`);
    return data;
  },

  create: async (payload: MeetingCreatePayload): Promise<Meeting> => {
    const { data } = await apiClient.post<Meeting>('/meetings', payload);
    return data;
  },

  update: async (id: string, payload: MeetingUpdatePayload): Promise<Meeting> => {
    const { data } = await apiClient.patch<Meeting>(`/meetings/${id}`, payload);
    return data;
  },

  updateNotes: async (id: string, notes: string): Promise<Meeting> => {
    const { data } = await apiClient.patch<Meeting>(`/meetings/${id}/notes`, { notes });
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/meetings/${id}`);
  },
};