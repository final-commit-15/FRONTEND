// src/api/aiProviders.ts
// AI Providers API - multi-provider management, model listing, health monitoring

import { apiClient } from './client';

// NOTE: the backend returns payloads directly (no {data} envelope), so every
// call below unwraps axios's `response.data` exactly once. Do NOT use the
// `http.*` helpers here — they unwrap a second level and resolve undefined.

export interface ProviderConfig {
  provider: string;
  enabled: boolean;
  connected: boolean;
  default_model: string;
  models: string[];
  priority: number;
  base_url?: string;
  timeout: number;
  max_retries: number;
  health_status?: string;
  last_error?: string;
  models_available?: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  context_window: number;
  max_output_tokens: number;
  pricing_input: number;
  pricing_output: number;
  is_free: boolean;
  is_available: boolean;
  metadata: Record<string, any>;
  tags?: string[];
  excluded_from_pipeline?: boolean;
}

export interface ProviderHealth {
  provider: string;
  is_healthy: boolean;
  last_check: string;
  latency_ms: number;
  error_rate: number;
  consecutive_failures: number;
  last_error?: string;
  models_available: number;
  quota_remaining?: number;
  rate_limit_remaining?: number;
}

export interface ProvidersListResponse {
  providers: ProviderConfig[];
  default_provider: string;
  default_model: string;
}

export interface ModelsListResponse {
  models: Record<string, ModelInfo[]>;
}

export interface HealthCheckResponse {
  providers: Record<string, ProviderHealth>;
  overall_healthy: boolean;
}

export interface ChatCompletionRequest {
  messages: Array<{ role: string; content: string }>;
  model: string;
  provider?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  tools?: any[];
  tool_choice?: string;
  response_format?: Record<string, any>;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  provider: string;
  choices: Array<any>;
  usage: Record<string, number>;
}

export interface StageModelResponse {
  stage: string;
  model: string;
  provider: string;
}

// ============================================================================
// API Functions
// ============================================================================

export const aiProvidersApi = {
  // List all configured providers
  listProviders: async (): Promise<ProvidersListResponse> => {
    // NOTE: apiClient returns axios response; backend returns the object
    // directly (no {data} envelope), so unwrap exactly once here.
    const { data } = await apiClient.get<ProvidersListResponse>('/ai/providers');
    return data;
  },

  // List all models from all providers
  listModels: async (provider?: string, forceRefresh?: boolean): Promise<ModelsListResponse> => {
    const params = new URLSearchParams();
    if (provider) params.append('provider', provider);
    if (forceRefresh) params.append('force_refresh', 'true');
    const qs = params.toString();
    const { data } = await apiClient.get<ModelsListResponse>(`/ai/providers/models${qs ? `?${qs}` : ''}`);
    return data;
  },

  // List models for a specific provider
  listProviderModels: async (provider: string, forceRefresh?: boolean): Promise<ModelInfo[]> => {
    const params = new URLSearchParams();
    if (forceRefresh) params.append('force_refresh', 'true');
    const qs = params.toString();
    const { data } = await apiClient.get<ModelInfo[]>(`/ai/providers/models/${provider}${qs ? `?${qs}` : ''}`);
    return data;
  },

  // Check health of all providers
  healthCheck: async (): Promise<HealthCheckResponse> => {
    const { data } = await apiClient.get<HealthCheckResponse>('/ai/providers/health');
    return data;
  },

  // Check health of a specific provider
  providerHealth: async (provider: string): Promise<ProviderHealth> => {
    const { data } = await apiClient.get<ProviderHealth>(`/ai/providers/health/${provider}`);
    return data;
  },

  // Chat completion with automatic provider selection
  chatCompletion: async (request: ChatCompletionRequest): Promise<ChatCompletionResponse> => {
    const { data } = await apiClient.post<ChatCompletionResponse>('/ai/providers/chat', request);
    return data;
  },

  // Get configured model for a pipeline stage
  getStageModel: async (stage: string): Promise<StageModelResponse> => {
    const { data } = await apiClient.get<StageModelResponse>(`/ai/providers/stage-model/${stage}`);
    return data;
  },

  // Initialize all providers
  initializeProviders: async (): Promise<any> => {
    const { data } = await apiClient.post<any>('/ai/providers/initialize');
    return data;
  },

  // Runtime enable/disable for one provider (resets on backend restart)
  setProviderEnabled: async (provider: string, enabled: boolean): Promise<{ provider: string; enabled: boolean; connected: boolean }> => {
    const { data } = await apiClient.post<{ provider: string; enabled: boolean; connected: boolean }>(
      `/ai/providers/${provider}/enabled`,
      { enabled },
    );
    return data;
  },

  // Force a live model-list refresh for one provider
  refreshProviderModels: async (provider: string): Promise<{ provider: string; count: number; models: string[] }> => {
    const { data } = await apiClient.post<{ provider: string; count: number; models: string[] }>(
      `/ai/providers/${provider}/refresh-models`,
    );
    return data;
  },
};

// ============================================================================
// Type Guards
// ============================================================================

export function isProviderHealthy(health: ProviderHealth): boolean {
  return health.is_healthy;
}

export function getHealthyProviders(health: HealthCheckResponse): ProviderHealth[] {
  return Object.values(health.providers).filter(isProviderHealthy);
}

export function getProviderStatusColor(isHealthy: boolean): string {
  return isHealthy ? 'text-emerald-600' : 'text-red-600';
}