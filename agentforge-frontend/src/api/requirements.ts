import { apiClient, getApiErrorMessage } from './client';
import type {
  RequirementOut,
  RequirementCreate,
  RequirementUpdate,
  RequirementListResponse,
  FeatureOut,
  FeatureCreate,
  FeatureUpdate,
  FeatureListResponse,
  SprintOut,
  SprintCreate,
  SprintUpdate,
  SprintListResponse,
  SprintNoteOut,
  SprintNoteCreate,
  SprintNoteUpdate,
  SprintNoteListResponse,
  BlockerOut,
  BlockerCreate,
  BlockerUpdate,
  DecisionOut,
  DecisionCreate,
  SprintAnalytics,
} from '@/types/api';

export const requirementsApi = {
  // Requirements
  list: async (params?: { 
    search?: string;
    status?: string; 
    skip?: number; 
    limit?: number 
  }): Promise<RequirementListResponse> => {
    const { data } = await apiClient.get<RequirementListResponse>('/requirements', { params });
    return data;
  },

  get: async (id: string): Promise<RequirementOut> => {
    const { data } = await apiClient.get<RequirementOut>(`/requirements/${id}`);
    return data;
  },

  create: async (payload: RequirementCreate): Promise<RequirementOut> => {
    const { data } = await apiClient.post<RequirementOut>('/requirements', payload);
    return data;
  },

  update: async (id: string, payload: RequirementUpdate): Promise<RequirementOut> => {
    const { data } = await apiClient.patch<RequirementOut>(`/requirements/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/requirements/${id}`);
  },

  uploadFile: async (requirementId: string, file: File, source: string): Promise<RequirementOut> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source', source);
    const { data } = await apiClient.post<RequirementOut>(`/requirements/${requirementId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  process: async (requirementId: string): Promise<RequirementOut> => {
    const { data } = await apiClient.post<RequirementOut>(`/requirements/${requirementId}/process`);
    return data;
  },

  // Features
  listFeatures: async (params?: { 
    search?: string;
    status?: string; 
    priority?: string; 
    assignee_id?: string;
    sort?: string;
    skip?: number; 
    limit?: number 
  }): Promise<FeatureListResponse> => {
    const { data } = await apiClient.get<FeatureListResponse>('/features', { params });
    return data;
  },

  getFeature: async (id: string): Promise<FeatureOut> => {
    const { data } = await apiClient.get<FeatureOut>(`/features/${id}`);
    return data;
  },

  createFeature: async (payload: FeatureCreate): Promise<FeatureOut> => {
    const { data } = await apiClient.post<FeatureOut>('/features', payload);
    return data;
  },

  updateFeature: async (id: string, payload: FeatureUpdate): Promise<FeatureOut> => {
    const { data } = await apiClient.patch<FeatureOut>(`/features/${id}`, payload);
    return data;
  },

  deleteFeature: async (id: string): Promise<void> => {
    await apiClient.delete(`/features/${id}`);
  },

  getFeatureTasks: async (featureId: string): Promise<any[]> => {
    const { data } = await apiClient.get<any[]>(`/features/${featureId}/tasks`);
    return data;
  },

  // Sprints
  listSprints: async (params?: { 
    status?: string; 
    skip?: number; 
    limit?: number 
  }): Promise<SprintListResponse> => {
    const { data } = await apiClient.get<SprintListResponse>('/sprints', { params });
    return data;
  },

  getSprint: async (id: string): Promise<SprintOut> => {
    const { data } = await apiClient.get<SprintOut>(`/sprints/${id}`);
    return data;
  },

  createSprint: async (payload: SprintCreate): Promise<SprintOut> => {
    const { data } = await apiClient.post<SprintOut>('/sprints', payload);
    return data;
  },

  updateSprint: async (id: string, payload: SprintUpdate): Promise<SprintOut> => {
    const { data } = await apiClient.patch<SprintOut>(`/sprints/${id}`, payload);
    return data;
  },

  startSprint: async (id: string): Promise<SprintOut> => {
    const { data } = await apiClient.post<SprintOut>(`/sprints/${id}/start`);
    return data;
  },

  completeSprint: async (id: string): Promise<SprintOut> => {
    const { data } = await apiClient.post<SprintOut>(`/sprints/${id}/complete`);
    return data;
  },

  getSprintAnalytics: async (id: string): Promise<SprintAnalytics> => {
    const { data } = await apiClient.get<SprintAnalytics>(`/sprints/${id}/analytics`);
    return data;
  },

  // Sprint Notes
  createSprintNote: async (sprintId: string, payload: SprintNoteCreate): Promise<SprintNoteOut> => {
    const { data } = await apiClient.post<SprintNoteOut>(`/sprints/${sprintId}/notes`, payload);
    return data;
  },

  listSprintNotes: async (sprintId?: string, skip?: number, limit?: number): Promise<SprintNoteOut[]> => {
    const url = sprintId ? `/sprints/${sprintId}/notes` : '/sprint-notes';
    const { data } = await apiClient.get<SprintNoteOut[]>(url, { params: { skip, limit } });
    return data;
  },

  updateSprintNote: async (sprintId: string, noteId: string, payload: SprintNoteUpdate): Promise<SprintNoteOut> => {
    const { data } = await apiClient.patch<SprintNoteOut>(`/sprints/${sprintId}/notes/${noteId}`, payload);
    return data;
  },

  // Blockers
  listBlockers: async (params?: { 
    sprint_id?: string; 
    status?: string; 
    skip?: number; 
    limit?: number 
  }): Promise<BlockerOut[]> => {
    const { data } = await apiClient.get<BlockerOut[]>('/blockers', { params });
    return data;
  },

  getBlocker: async (id: string): Promise<BlockerOut> => {
    const { data } = await apiClient.get<BlockerOut>(`/blockers/${id}`);
    return data;
  },

  createBlocker: async (payload: BlockerCreate): Promise<BlockerOut> => {
    const { data } = await apiClient.post<BlockerOut>('/blockers', payload);
    return data;
  },

  updateBlocker: async (id: string, payload: BlockerUpdate): Promise<BlockerOut> => {
    const { data } = await apiClient.patch<BlockerOut>(`/blockers/${id}`, payload);
    return data;
  },

  resolveBlocker: async (id: string): Promise<BlockerOut> => {
    const { data } = await apiClient.post<BlockerOut>(`/blockers/${id}/resolve`);
    return data;
  },

  // Decisions
  listDecisions: async (params?: { 
    sprint_id?: string; 
    skip?: number; 
    limit?: number 
  }): Promise<DecisionOut[]> => {
    const { data } = await apiClient.get<DecisionOut[]>('/decisions', { params });
    return data;
  },

  createDecision: async (payload: DecisionCreate): Promise<DecisionOut> => {
    const { data } = await apiClient.post<DecisionOut>('/decisions', payload);
    return data;
  },
};

export const teamMembersApi = {
  // Team Members
  list: async (): Promise<any[]> => {
    const { data } = await apiClient.get<any[]>('/team-members');
    return data;
  },

  get: async (id: string): Promise<any> => {
    const { data } = await apiClient.get<any>(`/team-members/${id}`);
    return data;
  },

  create: async (payload: any): Promise<any> => {
    const { data } = await apiClient.post<any>('/team-members', payload);
    return data;
  },

  update: async (id: string, payload: any): Promise<any> => {
    const { data } = await apiClient.patch<any>(`/team-members/${id}`, payload);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/team-members/${id}`);
  },

  // Invitations
  listInvitations: async (): Promise<any[]> => {
    const { data } = await apiClient.get<any[]>('/team-members/invitations');
    return data;
  },

  createInvitation: async (payload: any): Promise<any> => {
    const { data } = await apiClient.post<any>('/team-members/invitations', payload);
    return data;
  },

  acceptInvitation: async (invitationId: string): Promise<any> => {
    const { data } = await apiClient.post<any>(`/team-members/invitations/${invitationId}/accept`);
    return data;
  },

  revokeInvitation: async (invitationId: string): Promise<void> => {
    await apiClient.post(`/team-members/invitations/${invitationId}/revoke`);
  },
};