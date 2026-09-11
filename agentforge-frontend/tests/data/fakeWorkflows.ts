import { faker } from '@faker-js/faker';

export interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  inputs: string[];
  outputs: string[];
}

export interface WorkflowConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  isActive: boolean;
  lastExecutedAt?: Date;
  executionCount: number;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export const nodeTypes = [
  'trigger',
  'action',
  'condition',
  'transform',
  'ai-model',
  'http-request',
  'database',
  'notification',
] as const;

export function createFakeNode(overrides: Partial<WorkflowNode> = {}): WorkflowNode {
  return {
    id: faker.string.uuid(),
    type: faker.helpers.arrayElement(nodeTypes),
    name: faker.hacker.phrase(),
    position: { x: faker.number.int({ min: 100, max: 800 }), y: faker.number.int({ min: 100, max: 600 }) },
    config: {},
    inputs: [],
    outputs: [],
    ...overrides,
  };
}

export function createFakeConnection(sourceId: string, targetId: string): WorkflowConnection {
  return {
    id: faker.string.uuid(),
    source: sourceId,
    target: targetId,
    sourceHandle: 'output',
    targetHandle: 'input',
  };
}

export function createFakeWorkflow(overrides: Partial<Workflow> = {}): Workflow {
  const nodeCount = faker.number.int({ min: 2, max: 8 });
  const nodes = Array.from({ length: nodeCount }, () => createFakeNode());
  const connections: WorkflowConnection[] = [];

  for (let i = 1; i < nodes.length; i++) {
    connections.push(createFakeConnection(nodes[i - 1].id, nodes[i].id));
  }

  return {
    id: faker.string.uuid(),
    name: `${faker.hacker.noun()} ${faker.hacker.verb()} Workflow`,
    description: faker.lorem.paragraph(),
    nodes,
    connections,
    isActive: faker.datatype.boolean(),
    lastExecutedAt: faker.datatype.boolean() ? faker.date.recent({ days: 7 }) : undefined,
    executionCount: faker.number.int({ min: 0, max: 1000 }),
    createdAt: faker.date.past({ years: 1 }),
    updatedAt: faker.date.recent({ days: 30 }),
    tags: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => faker.hacker.noun()),
    ...overrides,
  };
}

export function createSimpleWorkflow(): Workflow {
  const trigger = createFakeNode({ type: 'trigger', name: 'Webhook Trigger', position: { x: 200, y: 200 } });
  const action = createFakeNode({ type: 'action', name: 'Process Data', position: { x: 500, y: 200 } });
  const notification = createFakeNode({ type: 'notification', name: 'Send Notification', position: { x: 800, y: 200 } });

  return createFakeWorkflow({
    name: 'Simple Data Processing',
    nodes: [trigger, action, notification],
    connections: [
      createFakeConnection(trigger.id, action.id),
      createFakeConnection(action.id, notification.id),
    ],
  });
}

export function createAiWorkflow(): Workflow {
  const trigger = createFakeNode({ type: 'trigger', name: 'Chat Input', position: { x: 200, y: 200 } });
  const aiModel = createFakeNode({ type: 'ai-model', name: 'GPT-4', position: { x: 500, y: 200 }, config: { model: 'gpt-4', temperature: 0.7 } });
  const output = createFakeNode({ type: 'action', name: 'Format Response', position: { x: 800, y: 200 } });

  return createFakeWorkflow({
    name: 'AI Chat Workflow',
    nodes: [trigger, aiModel, output],
    connections: [
      createFakeConnection(trigger.id, aiModel.id),
      createFakeConnection(aiModel.id, output.id),
    ],
  });
}

export function createMultipleWorkflows(count: number): Workflow[] {
  return Array.from({ length: count }, () => createFakeWorkflow());
}