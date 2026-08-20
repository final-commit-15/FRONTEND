// src/hooks/useAuth.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import type { User } from '@/types/models';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuth(): AuthState & {
  login: ReturnType<typeof useMutation<unknown, Error, Parameters<typeof authApi.login>[0]>>;
  register: ReturnType<typeof useMutation<unknown, Error, Parameters<typeof authApi.register>[0]>>;
  logout: () => Promise<void>;
} {
  const queryClient = useQueryClient();
  const { setAuth, logout: storeLogout } = useAuthStore();

  // ── Query: fetch current user ──────────────────────────────
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ── Mutations ──────────────────────────────────────────────
  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Ensure tokens are strings (provide fallback empty string if undefined)
      setAuth(
        data.user,
        data.access_token ?? '',
        data.refresh_token ?? ''
      );
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const register = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth(
        data.user,
        data.access_token ?? '',
        data.refresh_token ?? ''
      );
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  // ── Logout (syncs store and query cache) ──────────────────
  const logout = async () => {
    await authApi.logout();
    storeLogout(); // clear zustand state
    queryClient.clear(); // reset all queries
    window.location.href = '/login';
  };

  return {
    user: user ?? null,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };
}