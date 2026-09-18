import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { authApi } from '@/api/auth';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types/models';
import type {
  AuthTokens,
  OtpSendRequest,
  OtpVerifyRequest,
  OtpVerifyResponse,
  ResetPasswordRequest,
} from '@/types/api';

export function useAuth() {
  const queryClient = useQueryClient();
  const {
    accessToken,
    user: storeUser,
    workspace,
    setTokens,
    setUser,
    setWorkspace,
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

  // ── Login mutation (legacy password) ───────────────────────
  const login = useMutation({
    mutationFn: authApi.login,
    async onSuccess(tokens: AuthTokens) {
      setTokens(tokens);
      const user = await authApi.me();
      setUser(user);
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  // ── Register mutation (legacy password) ────────────────────
  const register = useMutation({
    mutationFn: authApi.register,
    async onSuccess(tokens: AuthTokens) {
      setTokens(tokens);
      const user = await authApi.me();
      setUser(user);
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  // ── Email OTP (AgentForge V2) ──────────────────────────────
  const sendOtp = useMutation({
    mutationFn: async (payload: OtpSendRequest) => {
      const res = await authApi.sendOtp(payload);
      return res;
    },
  });

  const verifyOtp = useMutation({
    mutationFn: async (payload: OtpVerifyRequest): Promise<OtpVerifyResponse> => {
      const res = await authApi.verifyOtp(payload);
      // Persist a full session ONLY when a real session came back (login flow).
      // Registration resolves with user/workspace but NO tokens — the user is
      // expected to sign in with the password they created.
      if (res.success && res.access_token) {
        setTokens({
          access_token: res.access_token,
          refresh_token: res.refresh_token ?? '',
          token_type: res.token_type ?? 'bearer',
        } as AuthTokens);
        if (res.user) {
          setUser(res.user);
        }
        setWorkspace(res.workspace ?? null);
        apiClient.defaults.headers.common.Authorization = `Bearer ${res.access_token}`;
        await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      }
      return res;
    },
  });

  const resetPassword = useMutation({
    mutationFn: async (payload: ResetPasswordRequest) => {
      return authApi.resetPassword(payload);
    },
  });

  return {
    user: meQuery.data ?? storeUser ?? null,
    workspace,
    isAuthenticated: !!accessToken,
    isLoading: !!accessToken && meQuery.isLoading,
    login,
    register,
    sendOtp,
    verifyOtp,
    resetPassword,
    logout,
  };
}