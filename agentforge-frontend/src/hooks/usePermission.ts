// src/hooks/usePermission.ts

import { useAuth } from './useAuth';
import type { UserRole } from '@/types/models';

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'agents:create',
    'agents:update',
    'agents:delete',
    'tasks:create',
    'tasks:update',
    'executions:run',
    'settings:update',
    'permissions:update',
    'tools:update',
  ],
  developer: [
    'agents:create',
    'agents:update',
    'tasks:create',
    'tasks:update',
    'executions:run',
    'agents:view',
    'analytics:view',
    'tools:view',
  ],
  operator: [
    'executions:run',
    'agents:view',
    'tasks:view',
    'analytics:view',
  ],
  user: [
    'tasks:create',
    'tasks:update',
    'executions:run',
    'agents:view',
    'analytics:view',
  ],
  viewer: [
    'agents:view',
    'tasks:view',
    'analytics:view',
  ],
};

export function usePermission() {
  const { user, isAuthenticated } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!isAuthenticated || !user) return false;
    return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return {
    user,
    isAuthenticated,
    hasPermission,
    hasRole,
    isAdmin: user?.role === 'admin',
  };
}