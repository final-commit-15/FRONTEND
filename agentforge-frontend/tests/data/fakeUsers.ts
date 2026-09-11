import { faker } from '@faker-js/faker';

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'member' | 'viewer';
  avatar?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  workspaceId: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
  ownerId: string;
  members: string[];
}

export interface Workspace {
  id: string;
  name: string;
  organizationId: string;
  createdAt: Date;
  settings: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
  };
}

export function createFakeUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    password: 'password123',
    role: faker.helpers.arrayElement(['admin', 'member', 'viewer']),
    avatar: faker.image.avatar(),
    createdAt: faker.date.past({ years: 2 }),
    lastLoginAt: faker.date.recent({ days: 7 }),
    isActive: true,
    workspaceId: faker.string.uuid(),
    ...overrides,
  };
}

export function createFakeAdmin(overrides: Partial<User> = {}): User {
  return createFakeUser({ role: 'admin', ...overrides });
}

export function createFakeViewer(overrides: Partial<User> = {}): User {
  return createFakeUser({ role: 'viewer', ...overrides });
}

export function createFakeOrganization(overrides: Partial<Organization> = {}): Organization {
  const name = faker.company.name();
  return {
    id: faker.string.uuid(),
    name,
    slug: faker.helpers.slugify(name).toLowerCase(),
    plan: faker.helpers.arrayElement(['free', 'pro', 'enterprise']),
    createdAt: faker.date.past({ years: 1 }),
    ownerId: faker.string.uuid(),
    members: Array.from({ length: faker.number.int({ min: 1, max: 10 }) }, () => faker.string.uuid()),
    ...overrides,
  };
}

export function createFakeWorkspace(organizationId: string, overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: faker.string.uuid(),
    name: faker.company.buzzPhrase(),
    organizationId,
    createdAt: faker.date.past({ years: 1 }),
    settings: {
      theme: faker.helpers.arrayElement(['light', 'dark', 'system']),
      notifications: faker.datatype.boolean(),
      language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de']),
    },
    ...overrides,
  };
}

export function createMultipleUsers(count: number, role?: User['role']): User[] {
  return Array.from({ length: count }, () => createFakeUser({ role }));
}

export const testUsers = {
  admin: createFakeAdmin({ email: 'admin@agentforge.ai', name: 'Test Admin' }),
  member: createFakeUser({ email: 'member@agentforge.ai', name: 'Test Member', role: 'member' }),
  viewer: createFakeViewer({ email: 'viewer@agentforge.ai', name: 'Test Viewer' }),
};