import { Page, Route } from '@playwright/test';

export async function mockAiResponses(page: Page, responses: string[] = []) {
  const defaultResponses = [
    'I understand. Let me help you with that.',
    'Here is the information you requested.',
    'I can assist you with that task.',
    'Based on your input, here is my response.',
    'Let me process that for you.',
  ];

  const mockResponses = responses.length > 0 ? responses : defaultResponses;
  let responseIndex = 0;

  await page.route('**/api/v1/chat/**', async (route: Route) => {
    const response = mockResponses[responseIndex % mockResponses.length];
    responseIndex++;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: { role: 'assistant', content: response },
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      }),
    });
  });

  await page.route('**/v1/chat/completions', async (route: Route) => {
    const response = mockResponses[responseIndex % mockResponses.length];
    responseIndex++;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'chatcmpl-mock',
        object: 'chat.completion',
        created: Date.now(),
        model: 'gpt-4',
        choices: [{
          index: 0,
          message: { role: 'assistant', content: response },
          finish_reason: 'stop',
        }],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      }),
    });
  });

  await page.route('**/v1/embeddings', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        object: 'list',
        data: [{
          object: 'embedding',
          embedding: Array.from({ length: 1536 }, () => Math.random()),
          index: 0,
        }],
        usage: { prompt_tokens: 100, total_tokens: 100 },
      }),
    });
  });
}

export async function mockStreamingAiResponse(page: Page, chunks: string[] = ['Hello', ' ', 'world', '!']) {
  await page.route('**/api/v1/chat/stream', async (route: Route) => {
    const response = route.request().response();
    if (response) {
      // For SSE streaming, we need to handle differently
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: chunks.map(chunk => `data: ${JSON.stringify({ content: chunk })}\n\n`).join('') + 'data: [DONE]\n\n',
      });
    }
  });
}

export async function mockAiModels(page: Page) {
  await page.route('**/v1/models', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        object: 'list',
        data: [
          { id: 'gpt-4', object: 'model', created: Date.now(), owned_by: 'openai' },
          { id: 'gpt-3.5-turbo', object: 'model', created: Date.now(), owned_by: 'openai' },
          { id: 'claude-3-opus', object: 'model', created: Date.now(), owned_by: 'anthropic' },
          { id: 'llama-2-70b', object: 'model', created: Date.now(), owned_by: 'meta' },
        ],
      }),
    });
  });
}

export async function mockAiHealth(page: Page) {
  await page.route('**/v1/health', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'healthy', version: '1.0.0', models_loaded: 4 }),
    });
  });
}

export async function mockAllAiServices(page: Page) {
  await mockAiResponses(page);
  await mockAiModels(page);
  await mockAiHealth(page);
}