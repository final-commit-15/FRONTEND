import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/models';
import type { AuthTokens, WorkspaceBrief } from '@/types/api';
import { apiClient } from '@/api/client';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  workspace: WorkspaceBrief | null;
  isAuthenticated: boolean;

  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: User) => void;
  setWorkspace: (workspace: WorkspaceBrief | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      workspace: null,
      isAuthenticated: false,

      setTokens: (tokens) =>
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          isAuthenticated: true,
        }),

      setUser: (user) => set({ user }),

      setWorkspace: (workspace) => set({ workspace }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          workspace: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'agentforge-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        workspace: state.workspace,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export const initializeAuth = () => {
  const token = useAuthStore.getState().accessToken;

  if (token) {
    apiClient.defaults.headers.common.Authorization =
      `Bearer ${token}`;
  }
};