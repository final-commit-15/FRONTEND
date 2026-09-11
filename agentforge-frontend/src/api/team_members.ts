import { apiClient, getApiErrorMessage } from './client';
import type {
  TeamMemberOut,
  TeamMemberCreate,
  TeamMemberUpdate,
  TeamMemberInvite,
  InvitationOut,
} from '@/types/api';

export const teamMembersApi = {
  // Team Members
  list: async (): Promise<TeamMemberOut[]> => {
    const { data } = await apiClient.get<TeamMemberOut[]>('/team-members');
    return data;
  },

  get: async (id: string): Promise<TeamMemberOut> => {
    const { data } = await apiClient.get<TeamMemberOut>(`/team-members/${id}`);
    return data;
  },

  create: async (payload: TeamMemberCreate): Promise<TeamMemberOut> => {
    const { data } = await apiClient.post<TeamMemberOut>('/team-members', payload);
    return data;
  },

  update: async (id: string, payload: TeamMemberUpdate): Promise<TeamMemberOut> => {
    const { data } = await apiClient.patch<TeamMemberOut>(`/team-members/${id}`, payload);
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

  createInvitation: async (payload: TeamMemberInvite): Promise<any> => {
    const { data } = await apiClient.post<any>('/team-members/invitations', payload);
    return data;
  },

  acceptInvitation: async (invitationId: string): Promise<InvitationOut> => {
    const { data } = await apiClient.post<InvitationOut>(`/team-members/invitations/${invitationId}/accept`);
    return data;
  },

  revokeInvitation: async (invitationId: string): Promise<void> => {
    await apiClient.post(`/team-members/invitations/${invitationId}/revoke`);
  },
};

export const invitationsApi = {
  list: async (): Promise<any[]> => {
    const { data } = await apiClient.get<any[]>('/team-members/invitations');
    return data;
  },

  create: async (payload: TeamMemberInvite): Promise<any> => {
    const { data } = await apiClient.post<any>('/team-members/invitations', payload);
    return data;
  },

  accept: async (invitationId: string): Promise<any> => {
    const { data } = await apiClient.post<any>(`/team-members/invitations/${invitationId}/accept`);
    return data;
  },

  revoke: async (invitationId: string): Promise<void> => {
    await apiClient.post(`/team-members/invitations/${invitationId}/revoke`);
  },
};