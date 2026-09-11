import { faker } from '@faker-js/faker';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    model?: string;
    tokens?: number;
    duration?: number;
    codeBlocks?: string[];
  };
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  messageCount: number;
}

export function createFakeMessage(role: Message['role'] = 'user', overrides: Partial<Message> = {}): Message {
  const content = role === 'user'
    ? faker.lorem.sentence()
    : faker.lorem.paragraphs({ min: 1, max: 3 });

  return {
    id: faker.string.uuid(),
    role,
    content,
    timestamp: faker.date.recent({ days: 7 }),
    metadata: role === 'assistant' ? {
      model: faker.helpers.arrayElement(['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'llama-2']),
      tokens: faker.number.int({ min: 50, max: 2000 }),
      duration: faker.number.int({ min: 500, max: 10000 }),
      codeBlocks: faker.datatype.boolean() ? [faker.lorem.sentence()] : [],
    } : undefined,
    ...overrides,
  };
}

export function createUserMessage(content?: string): Message {
  return createFakeMessage('user', { content: content || faker.lorem.sentence() });
}

export function createAssistantMessage(content?: string): Message {
  return createFakeMessage('assistant', { content: content || faker.lorem.paragraphs() });
}

export function createSystemMessage(content?: string): Message {
  return createFakeMessage('system', { content: content || faker.lorem.sentence() });
}

export function createFakeConversation(overrides: Partial<Conversation> = {}): Conversation {
  const messageCount = faker.number.int({ min: 2, max: 20 });
  const messages: Message[] = [];

  for (let i = 0; i < messageCount; i++) {
    messages.push(i % 2 === 0 ? createUserMessage() : createAssistantMessage());
  }

  return {
    id: faker.string.uuid(),
    title: faker.lorem.words({ min: 2, max: 5 }),
    messages,
    createdAt: faker.date.past({ months: 3 }),
    updatedAt: faker.date.recent({ days: 7 }),
    isPinned: faker.datatype.boolean(),
    messageCount,
    ...overrides,
  };
}

export function createConversationWithCode(): Conversation {
  const conversation = createFakeConversation();
  conversation.messages.push(
    createAssistantMessage('Here is a code example:\n```python\nprint("Hello, World!")\n```')
  );
  return conversation;
}

export function createMultiTurnConversation(turns: number = 5): Conversation {
  const messages: Message[] = [];
  for (let i = 0; i < turns; i++) {
    messages.push(createUserMessage());
    messages.push(createAssistantMessage());
  }
  return createFakeConversation({ messages, messageCount: messages.length });
}

export function createMultipleConversations(count: number): Conversation[] {
  return Array.from({ length: count }, () => createFakeConversation());
}

export const sampleConversations = [
  createFakeConversation({ title: 'Getting Started with AgentForge', messageCount: 8 }),
  createConversationWithCode(),
  createMultiTurnConversation(10),
  createFakeConversation({ title: 'API Integration Help', messageCount: 6 }),
  createFakeConversation({ title: 'Workflow Debugging', messageCount: 12, isPinned: true }),
];