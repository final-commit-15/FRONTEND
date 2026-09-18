import { apiClient } from './client';

export interface ProjectCreateInput {
  name: string;
  description?: string;
  workspace_id?: string;
  client_name?: string;
  client_email?: string;
  company?: string;
  organization_name?: string;
  project_priority?: string;
  expected_delivery_date?: string;
  deadline?: string;
  status?: string;
  team_members?: string[];
}

export const projectsApi = {
  list: async (workspaceId?: string): Promise<any[]> => {
    // P0 contract: GET /api/projects → 200. Backend serves both the bare
    // (/projects/) and /api-prefixed shapes; prefer the /api shape and fall
    // back to the legacy path for older deployments.
    const params = workspaceId ? { workspace_id: workspaceId } : undefined;
    try {
      const { data } = await apiClient.get<any[]>('/api/projects/', { params });
      return data;
    } catch {
      const { data } = await apiClient.get<any[]>('/projects/', { params });
      return data;
    }
  },
  get: async (id: string): Promise<any> => {
    const { data } = await apiClient.get<any>(`/projects/${id}`);
    return data;
  },
  create: async (payload: ProjectCreateInput): Promise<any> => {
    const { data } = await apiClient.post<any>('/projects/', payload);
    return data;
  },
  update: async (id: string, payload: Partial<ProjectCreateInput>): Promise<any> => {
    const { data } = await apiClient.patch<any>(`/projects/${id}`, payload);
    return data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },
};
