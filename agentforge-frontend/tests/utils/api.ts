import { APIRequestContext, expect } from '@playwright/test';

export interface ApiResponse<T = unknown> {
  status: number;
  data: T;
  headers: Record<string, string>;
}

export class ApiClient {
  private request: APIRequestContext;
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(request: APIRequestContext, baseURL: string) {
    this.request = request;
    this.baseURL = baseURL;
    this.defaultHeaders = { 'Content-Type': 'application/json' };
  }

  setAuthToken(token: string) {
    this.defaultHeaders.Authorization = `Bearer ${token}`;
  }

  clearAuthToken() {
    delete this.defaultHeaders.Authorization;
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
    }
    const response = await this.request.get(url.toString(), { headers: this.defaultHeaders });
    const data = await response.json().catch(() => null);
    return { status: response.status(), data: data as T, headers: response.headers() };
  }

  async post<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    const response = await this.request.post(`${this.baseURL}${endpoint}`, {
      headers: this.defaultHeaders,
      data: body,
    });
    const data = await response.json().catch(() => null);
    return { status: response.status(), data: data as T, headers: response.headers() };
  }

  async put<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    const response = await this.request.put(`${this.baseURL}${endpoint}`, {
      headers: this.defaultHeaders,
      data: body,
    });
    const data = await response.json().catch(() => null);
    return { status: response.status(), data: data as T, headers: response.headers() };
  }

  async patch<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    const response = await this.request.patch(`${this.baseURL}${endpoint}`, {
      headers: this.defaultHeaders,
      data: body,
    });
    const data = await response.json().catch(() => null);
    return { status: response.status(), data: data as T, headers: response.headers() };
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await this.request.delete(`${this.baseURL}${endpoint}`, {
      headers: this.defaultHeaders,
    });
    const data = await response.json().catch(() => null);
    return { status: response.status(), data: data as T, headers: response.headers() };
  }

  expectSuccess<T>(response: ApiResponse<T>): T {
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
    return response.data;
  }

  expectError(response: ApiResponse, expectedStatus: number): void {
    expect(response.status).toBe(expectedStatus);
  }
}

export function createApiClient(request: APIRequestContext, baseURL?: string): ApiClient {
  return new ApiClient(request, baseURL || process.env.API_URL || 'http://localhost:8000');
}