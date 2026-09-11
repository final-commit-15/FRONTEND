import { faker } from '@faker-js/faker';

export interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  author: string;
  downloads: number;
  rating: number;
  isInstalled: boolean;
  isEnabled: boolean;
  capabilities: string[];
  pricing: 'free' | 'paid' | 'freemium';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const agentCategories = [
  'development',
  'data-analysis',
  'content-creation',
  'automation',
  'integration',
  'ai-ml',
  'productivity',
  'communication',
] as const;

export function createFakeAgent(overrides: Partial<Agent> = {}): Agent {
  const category = faker.helpers.arrayElement(agentCategories);
  return {
    id: faker.string.uuid(),
    name: `${faker.hacker.noun()} ${faker.hacker.verb()} Agent`,
    description: faker.lorem.paragraph(),
    category,
    version: `v${faker.system.semver()}`,
    author: faker.person.fullName(),
    downloads: faker.number.int({ min: 0, max: 100000 }),
    rating: parseFloat(faker.number.float({ min: 3.0, max: 5.0, precision: 0.1 }).toFixed(1)),
    isInstalled: faker.datatype.boolean(),
    isEnabled: faker.datatype.boolean(),
    capabilities: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.hacker.phrase()),
    pricing: faker.helpers.arrayElement(['free', 'paid', 'freemium']),
    tags: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => faker.hacker.noun()),
    createdAt: faker.date.past({ years: 1 }),
    updatedAt: faker.date.recent({ days: 30 }),
    ...overrides,
  };
}

export function createInstalledAgent(overrides: Partial<Agent> = {}): Agent {
  return createFakeAgent({ isInstalled: true, isEnabled: true, ...overrides });
}

export function createDisabledAgent(overrides: Partial<Agent> = {}): Agent {
  return createFakeAgent({ isInstalled: true, isEnabled: false, ...overrides });
}

export function createMultipleAgents(count: number): Agent[] {
  return Array.from({ length: count }, () => createFakeAgent());
}

export const popularAgents = [
  createFakeAgent({ name: 'Code Generator', category: 'development', downloads: 50000, rating: 4.8 }),
  createFakeAgent({ name: 'Data Analyzer', category: 'data-analysis', downloads: 35000, rating: 4.7 }),
  createFakeAgent({ name: 'Content Writer', category: 'content-creation', downloads: 42000, rating: 4.6 }),
  createFakeAgent({ name: 'API Integrator', category: 'integration', downloads: 28000, rating: 4.5 }),
  createFakeAgent({ name: 'Task Automator', category: 'automation', downloads: 31000, rating: 4.4 }),
];