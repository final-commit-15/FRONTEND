import { test, expect } from '@playwright/test';
import { createApiClient } from '../utils/api';

test.describe('Backend API Tests', () => {
  const apiURL = process.env.API_URL || 'http://localhost:8000';

  test('health endpoint returns healthy', async ({ request }) => {
    const api = createApiClient(request, apiURL);
    const response = await api.get('/health');
    api.expectSuccess(response);
    expect(response.data).toHaveProperty('status', 'healthy');
  });

  test('login endpoint works', async ({ request }) => {
    const api = createApiClient(request, apiURL);
    const response = await api.post('/auth/login', {
      email: process.env.TEST_EMAIL || 'test@agentforge.ai',
      password: process.env.TEST_PASSWORD || 'password123',
    });
    api.expectSuccess(response);
    expect(response.data).toHaveProperty('access_token');
    expect(response.data).toHaveProperty('refresh_token');
  });

  test('login with invalid credentials fails', async ({ request }) => {
    const api = createApiClient(request, apiURL);
    const response = await api.post('/auth/login', {
      email: 'invalid@test.com',
      password: 'wrongpassword',
    });
    api.expectError(response, 401);
  });

  test('token refresh works', async ({ request }) => {
    const api = createApiClient(request, apiURL);
    const loginResponse = await api.post('/auth/login', {
      email: process.env.TEST_EMAIL || 'test@agentforge.ai',
      password: process.env.TEST_PASSWORD || 'password123',
    });
    const refreshToken = loginResponse.data.refresh_token;

    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    api.expectSuccess(response);
    expect(response.data).toHaveProperty('access_token');
  });

  test('users endpoint requires authentication', async ({ request }) => {
    const api = createApiClient(request, apiURL);
    const response = await api.get('/users');
    api.expectError(response, 401);
  });

  test('authenticated users request works', async ({ request }) => {
    const api = createApiClient(request, apiURL);
    const loginResponse = await api.post('/auth/login', {
      email: process.env.TEST_EMAIL || 'test@agentforge.ai',
      password: process.env.TEST_PASSWORD || 'password123',
    });
    api.setAuthToken(loginResponse.data.access_token);

    const response = await api.get('/users/me');
    api.expectSuccess(response);
    expect(response.data).toHaveProperty('email');
  });

  test('workspaces endpoint works', async ({ request }) => {
    const api = createApiClient(request, apiURL);
    const loginResponse = await api.post('/auth/login', {
      email: process.env.TEST_EMAIL || 'test@agentforge.ai',
      password: process.env.TEST_PASSWORD || 'password123',
    });
    api.setAuthToken(loginResponse.data.access_token);

    const response = await api.get('/workspaces');
    api.expectSuccess(response);
    expect(Array.isArray(response.data)).toBeTruthy();
  });

  test('agents endpoint works', async ({ request }) => {
    const api = createApiClient(request, apiURL);
    const loginResponse = await api.post('/auth/login', {
      email: process.env.TEST_EMAIL || 'test@agentforge.ai',
      password: process.env.TEST_PASSWORD || 'password123',
    });
    api.setAuthToken(loginResponse.data.access_token);

    const response = await api.get('/agents');
    api.expectSuccess(response);
    expect(response.data).toHaveProperty('items');
  });

  test('workflows endpoint works', async ({ request }) => {
    const api = createApiClient(request, apiURL);
    const loginResponse = await api.post('/auth/login', {
      email: process.env.TEST_EMAIL || 'test@agentforge.ai',
      password: process.env.TEST_PASSWORD || 'password123',
    });
    api.setAuthToken(loginResponse.data.access_token);

    const response = await api.get('/workflows');
    api.expectSuccess(response);
    expect(response.data).toHaveProperty('items');
  });

  test('chat endpoint works', async ({ request }) => {
    const api = createApiClient(request, apiURL);
    const loginResponse = await api.post('/auth/login', {
      email: process.env.TEST_EMAIL || 'test@agentforge.ai',
      password: process.env.TEST_PASSWORD || 'password123',
    });
    api.setAuthToken(loginResponse.data.access_token);

    const response = await api.post('/chat', { message: 'Test message' });
    api.expectSuccess(response);
    expect(response.data).toHaveProperty('message');
  });

  test('notifications endpoint works', async ({ request }) => {
    const api = createApiClient(request, apiURL);
    const loginResponse = await api.post('/auth/login', {
      email: process.env.TEST_EMAIL || 'test@agentforge.ai',
      password: process.env.TEST_PASSWORD || 'password123',
    });
    api.setAuthToken(loginResponse.data.access_token);

    const response = await api.get('/notifications');
    api.expectSuccess(response);
  });

  test('billing endpoint works', async ({ request }) => {
    const api = createApiClient(request, apiURL);
    const loginResponse = await api.post('/auth/login', {
      email: process.env.TEST_EMAIL || 'test@agentforge.ai',
      password: process.env.TEST_PASSWORD || 'password123',
    });
    api.setAuthToken(loginResponse.data.access_token);

    const response = await api.get('/billing/subscription');
    api.expectSuccess(response);
    expect(response.data).toHaveProperty('plan');
  });
});