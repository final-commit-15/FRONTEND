import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types/models';
import type { AuthTokens } from '@/types/api';

export function useAuth() {
  const queryClient = useQueryClient();
  const {
    accessToken,
    setTokens,
    setUser,
    logout,
  } = useAuthStore();

  // ── Query: fetch current user ──────────────────────────────
  const meQuery = useQuery<User>({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: !!accessToken,
    retry: false,
    staleTime: 300000,
    gcTime: 600000,
  });

  // Side effects for query success/error
  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data);
    }
  }, [meQuery.data, setUser]);

  useEffect(() => {
    if (meQuery.error) {
      logout();
    }
  }, [meQuery.error, logout]);

  // ── Login mutation ──────────────────────────────────────────
  const login = useMutation({
    mutationFn: authApi.login,
    async onSuccess(tokens: AuthTokens) {
      setTokens(tokens);
      const user = await authApi.me();
      setUser(user);
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  // ── Register mutation ──────────────────────────────────────
  const register = useMutation({
    mutationFn: authApi.register,
    async onSuccess(tokens: AuthTokens) {
      setTokens(tokens);
      const user = await authApi.me();
      setUser(user);
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });


  return {
    user: meQuery.data ?? null,
    isAuthenticated: !!accessToken,
    isLoading: !!accessToken && meQuery.isLoading,
    login,
    register,
    logout,
  };
}