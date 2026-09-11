import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ChatPage extends BasePage {
  readonly newChatButton: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly stopButton: Locator;
  readonly regenerateButton: Locator;
  readonly conversationsList: Locator;
  readonly conversationItems: Locator;
  readonly messages: Locator;
  readonly loadingIndicator: Locator;
  readonly codeBlocks: Locator;
  readonly copyButtons: Locator;
  readonly deleteConversationButton: Locator;
  readonly renameConversationButton: Locator;
  readonly conversationTitle: Locator;

  constructor(page: Page) {
    super(page);
    this.newChatButton = page.getByTestId('new-chat-button').or(page.getByRole('button', { name: /new chat|new conversation/i }));
    this.messageInput = page.getByTestId('message-input').or(page.locator('textarea[placeholder*="message" i], textarea[placeholder*="chat" i]'));
    this.sendButton = page.getByTestId('send-button').or(page.locator('button[aria-label*="send" i]'));
    this.stopButton = page.getByTestId('stop-button').or(page.locator('button[aria-label*="stop" i]'));
    this.regenerateButton = page.getByTestId('regenerate-button').or(page.locator('button[aria-label*="regenerate" i]'));
    this.conversationsList = page.getByTestId('conversations-list').or(page.locator('[data-testid="conversations"], .conversation-list'));
    this.conversationItems = page.getByTestId('conversation-item').or(page.locator('[data-testid="conversation-item"], .conversation-item'));
    this.messages = page.getByTestId('message').or(page.locator('[data-testid="message"], .message'));
    this.loadingIndicator = page.getByTestId('loading-indicator').or(page.locator('.animate-spin, .loading'));
    this.codeBlocks = page.getByTestId('code-block').or(page.locator('pre code, .code-block'));
    this.copyButtons = page.getByTestId('copy-button').or(page.locator('button[aria-label*="copy" i]'));
    this.deleteConversationButton = page.getByTestId('delete-conversation').or(page.locator('button[aria-label*="delete conversation" i]'));
    this.renameConversationButton = page.getByTestId('rename-conversation').or(page.locator('button[aria-label*="rename conversation" i]'));
    this.conversationTitle = page.getByTestId('conversation-title').or(page.locator('[data-testid="conversation-title"], h1, h2'));
  }

  async open(): Promise<void> {
    await this.goto('/chat');
    await this.waitForLoadState();
  }

  async startNewChat(): Promise<void> {
    await this.newChatButton.click();
    await this.messageInput.waitFor({ state: 'visible' });
  }

  async sendMessage(message: string): Promise<void> {
    await this.messageInput.fill(message);
    await this.sendButton.click();
    await this.waitForResponse();
  }

  async waitForResponse(): Promise<void> {
    await this.loadingIndicator.waitFor({ state: 'visible', timeout: 5000 });
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 120000 });
  }

  async stopGeneration(): Promise<void> {
    await this.stopButton.click();
  }

  async regenerateLastResponse(): Promise<void> {
    await this.regenerateButton.click();
    await this.waitForResponse();
  }

  async getLastMessage(): Promise<string> {
    const lastMessage = this.messages.last();
    return (await lastMessage.textContent()) || '';
  }

  async getAllMessages(): Promise<string[]> {
    const count = await this.messages.count();
    const messages: string[] = [];
    for (let i = 0; i < count; i++) {
      messages.push((await this.messages.nth(i).textContent()) || '');
    }
    return messages;
  }

  async copyMessage(index: number = -1): Promise<void> {
    const buttons = this.copyButtons;
    const count = await buttons.count();
    if (count > 0) {
      const idx = index === -1 ? count - 1 : index;
      await buttons.nth(idx).click();
    }
  }

  async selectConversation(name: string): Promise<void> {
    const conversation = this.conversationItems.filter({ hasText: name }).first();
    await conversation.click();
    await this.waitForLoadState();
  }

  async deleteConversation(name: string): Promise<void> {
    await this.selectConversation(name);
    await this.deleteConversationButton.click();
    await this.page.getByRole('button', { name: /confirm|delete/i }).click();
    await this.waitForLoadState();
  }

  async renameConversation(oldName: string, newName: string): Promise<void> {
    await this.selectConversation(oldName);
    await this.renameConversationButton.click();
    await this.page.getByTestId('rename-input').or(this.page.locator('input[placeholder*="name" i]')).fill(newName);
    await this.page.getByRole('button', { name: /save|confirm/i }).click();
    await this.waitForLoadState();
  }

  async expectCodeBlocksVisible(): Promise<void> {
    await expect(this.codeBlocks.first()).toBeVisible();
  }

  async expectMessageContains(text: string | RegExp): Promise<void> {
    await expect(this.messages.last()).toContainText(text);
  }

  async expectConversationExists(name: string): Promise<void> {
    await expect(this.conversationItems.filter({ hasText: name }).first()).toBeVisible();
  }

  async expectNoConversations(): Promise<void> {
    await expect(this.conversationItems.first()).toBeHidden();
  }
}