import { test, expect } from '@playwright/test';
import { ChatPage, LoginPage } from '../pages';
import { mockAllAiServices } from '../mocks';

test.describe('Chat Tests', () => {
  let chatPage: ChatPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    loginPage = new LoginPage(page);
    await loginPage.goto('/login');
    await loginPage.loginAndWaitForDashboard(
      process.env.TEST_EMAIL || 'test@agentforge.ai',
      process.env.TEST_PASSWORD || 'password123'
    );
    await mockAllAiServices(page);
  });

  test('new chat can be started', async () => {
    await chatPage.open();
    await chatPage.startNewChat();
    await expect(chatPage.messageInput).toBeVisible();
  });

  test('message can be sent and response received', async () => {
    await chatPage.open();
    await chatPage.startNewChat();
    await chatPage.sendMessage('Hello, how are you?');
    await chatPage.expectMessageContains(/hello|hi|help/i);
  });

  test('streaming response indicator shows', async () => {
    await chatPage.open();
    await chatPage.startNewChat();
    await chatPage.sendMessage('Test message');
    await chatPage.loadingIndicator.waitFor({ state: 'visible', timeout: 5000 });
  });

  test('stop generation works', async () => {
    await chatPage.open();
    await chatPage.startNewChat();
    await chatPage.sendMessage('Write a very long story');
    await chatPage.stopGeneration();
    await expect(chatPage.loadingIndicator).toBeHidden();
  });

  test('regenerate response works', async () => {
    await chatPage.open();
    await chatPage.startNewChat();
    await chatPage.sendMessage('Test message');
    await chatPage.waitForResponse();
    await chatPage.regenerateLastResponse();
    await chatPage.loadingIndicator.waitFor({ state: 'visible', timeout: 5000 });
  });

  test('code blocks render correctly', async () => {
    await chatPage.open();
    await chatPage.startNewChat();
    await chatPage.sendMessage('Show me a Python hello world');
    await chatPage.waitForResponse();
    await chatPage.expectCodeBlocksVisible();
  });

  test('copy message button works', async () => {
    await chatPage.open();
    await chatPage.startNewChat();
    await chatPage.sendMessage('Test message');
    await chatPage.waitForResponse();
    await chatPage.copyMessage();
    // Verify clipboard content if possible
  });

  test('conversation history is maintained', async () => {
    await chatPage.open();
    await chatPage.startNewChat();
    await chatPage.sendMessage('First message');
    await chatPage.waitForResponse();
    await chatPage.sendMessage('Second message');
    await chatPage.waitForResponse();
    const messages = await chatPage.getAllMessages();
    expect(messages.length).toBeGreaterThanOrEqual(4); // 2 user + 2 assistant
  });

  test('conversation can be deleted', async () => {
    await chatPage.open();
    await chatPage.startNewChat();
    await chatPage.sendMessage('Test message');
    await chatPage.waitForResponse();
    await chatPage.deleteConversation('Test message');
    await chatPage.expectNoConversations();
  });

  test('conversation can be renamed', async () => {
    await chatPage.open();
    await chatPage.startNewChat();
    await chatPage.sendMessage('Test message');
    await chatPage.waitForResponse();
    await chatPage.renameConversation('Test message', 'Renamed Conversation');
    await chatPage.expectConversationExists('Renamed Conversation');
  });

  test('markdown rendering works', async () => {
    await chatPage.open();
    await chatPage.startNewChat();
    await chatPage.sendMessage('**Bold** and *italic* text');
    await chatPage.waitForResponse();
    await chatPage.expectMessageContains(/Bold|italic/i);
  });
});