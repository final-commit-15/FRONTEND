import { apiClient } from './client';

export interface IntakeUploadResponse {
  requirement_id: string;
  project_id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  provider: string;
  model: string;
  status: string;
}

export const intakeApi = {
  /** P0 contract: multipart project_id + file + provider + model → 200. */
  upload: async (params: {
    projectId: string;
    file: File;
    provider?: string;
    model?: string;
  }): Promise<IntakeUploadResponse> => {
    const form = new FormData();
    form.append('project_id', params.projectId);
    form.append('file', params.file, params.file.name);
    form.append('provider', params.provider || 'opencode-zen');
    form.append('model', params.model || '');
    const { data } = await apiClient.post<IntakeUploadResponse>(
      '/intelligence/intake',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
  },
};
