import { test, expect } from '@playwright/test';
import { createApiClient } from '../utils/api';

test.describe('AI Services API Tests', () => {
  const aiURL = process.env.AI_URL || 'http://localhost:8001';

  test('health endpoint returns healthy', async ({ request }) => {
    const api = createApiClient(request, aiURL);
    const response = await api.get('/v1/health');
    api.expectSuccess(response);
    expect(response.data).toHaveProperty('status', 'healthy');
  });

  test('models endpoint returns available models', async ({ request }) => {
    const api = createApiClient(request, aiURL);
    const response = await api.get('/v1/models');
    api.expectSuccess(response);
    expect(response.data).toHaveProperty('data');
    expect(Array.isArray(response.data.data)).toBeTruthy();
    expect(response.data.data.length).toBeGreaterThan(0);
  });

  test('chat completion works', async ({ request }) => {
    const api = createApiClient(request, aiURL);
    const response = await api.post('/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
    });
    api.expectSuccess(response);
    expect(response.data).toHaveProperty('choices');
    expect(response.data.choices[0]).toHaveProperty('message');
    expect(response.data.choices[0].message).toHaveProperty('content');
  });

  test('streaming chat completion works', async ({ request }) => {
    const api = createApiClient(request, aiURL);
    const response = await api.post('/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      stream: true,
    });
    expect(response.status).toBe(200);
    // For streaming, we'd need to handle SSE
  });

  test('embeddings endpoint works', async ({ request }) => {
    const api = createApiClient(request, aiURL);
    const response = await api.post('/v1/embeddings', {
      model: 'text-embedding-ada-002',
      input: 'Test text for embedding',
    });
    api.expectSuccess(response);
    expect(response.data).toHaveProperty('data');
    expect(response.data.data[0]).toHaveProperty('embedding');
    expect(Array.isArray(response.data.data[0].embedding)).toBeTruthy();
  });

  test('RAG query endpoint works', async ({ request }) => {
    const api = createApiClient(request, aiURL);
    const response = await api.post('/v1/rag/query', {
      query: 'What is AgentForge?',
      top_k: 5,
    });
    api.expectSuccess(response);
    expect(response.data).toHaveProperty('results');
  });

  test('RAG chat endpoint works', async ({ request }) => {
    const api = createApiClient(request, aiURL);
    const response = await api.post('/v1/rag/chat', {
      query: 'How do I create a workflow?',
      conversation_id: 'test-conversation',
    });
    api.expectSuccess(response);
    expect(response.data).toHaveProperty('answer');
  });

  test('generate endpoint works', async ({ request }) => {
    const api = createApiClient(request, aiURL);
    const response = await api.post('/v1/generate', {
      prompt: 'Write a hello world function in Python',
      max_tokens: 100,
    });
    api.expectSuccess(response);
    expect(response.data).toHaveProperty('text');
  });

  test('model availability check', async ({ request }) => {
    const api = createApiClient(request, aiURL);
    const response = await api.get('/v1/models');
    api.expectSuccess(response);
    const models = response.data.data.map((m: any) => m.id);
    expect(models).toContain('gpt-3.5-turbo');
  });

  test('error handling for invalid model', async ({ request }) => {
    const api = createApiClient(request, aiURL);
    const response = await api.post('/v1/chat/completions', {
      model: 'invalid-model',
      messages: [{ role: 'user', content: 'Hello' }],
    });
    api.expectError(response, 404);
  });

  test('error handling for invalid request', async ({ request }) => {
    const api = createApiClient(request, aiURL);
    const response = await api.post('/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      // Missing messages
    });
    api.expectError(response, 422);
  });
});