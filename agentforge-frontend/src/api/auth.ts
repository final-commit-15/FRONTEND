import { apiClient, getApiErrorMessage } from './client';
import axios from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  OtpSendRequest,
  OtpSendResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from '@/types/api';
import type { User } from '@/types/models';
import { useAuthStore } from '@/store/authStore';

export const authApi = {
  login: async (credentials: LoginRequest) => {
    try {
      const { data: tokens } = await apiClient.post<LoginResponse>(
        "/auth/login",
        credentials
      );

      useAuthStore.getState().setTokens(tokens);
      
      apiClient.defaults.headers.common.Authorization =
        `Bearer ${tokens.access_token}`;

      const { data: user } = await apiClient.get<User>("/auth/me");

      return {
        ...tokens,
        user,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(getApiErrorMessage(error), { cause: error });
    }
  },

  register: async (payload: RegisterRequest): Promise<LoginResponse> => {
    try {
      const { data } = await apiClient.post('/auth/register', {
        email: payload.email,
        username: payload.email.split('@')[0],
        full_name: payload.name,
        password: payload.password,
      });
      return data;
    } catch (error) {
      console.error('Register error:', error);
      throw new Error(getApiErrorMessage(error), { cause: error });
    }
  },

  // ═══ Email OTP (AgentForge V2) ═══

  /** Send an 8-digit OTP to the user's email. */
  sendOtp: async (payload: OtpSendRequest): Promise<OtpSendResponse> => {
    try {
      const { data } = await apiClient.post<OtpSendResponse>('/auth/otp/send', payload);
      // Treat delivery refusal as an error: the OTP is only persisted when
      // SMTP actually accepted it (smtpAccepted === true), and success=false
      // is returned by the backend for SMTP_ERROR / OTP_SEND_FAILED.
      if (!data.success || data.smtpAccepted === false) {
        throw new Error(data.message || 'Unable to deliver verification email.');
      }
      return data;
    } catch (error) {
      console.error('Send OTP error:', error);
      throw new Error(getApiErrorMessage(error), { cause: error });
    }
  },

  /**
   * Verify the 8-digit OTP; on register also creates the Supabase user
   * and workspace. Throws when the backend returns success === false
   * (INVALID_OTP / OTP_EXPIRED / OTP_LOCKED) so error.message renders properly.
   */
  verifyOtp: async (payload: OtpVerifyRequest): Promise<OtpVerifyResponse> => {
    try {
      const { data } = await apiClient.post<OtpVerifyResponse>('/auth/otp/verify', payload);
      if (!data.success) {
        throw new Error(data.message || 'Verification failed. Please try again.');
      }
      return data;
    } catch (error) {
      console.error('Verify OTP error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(getApiErrorMessage(error), { cause: error });
      }
      throw error;
    }
  },

  resetPassword: async (payload: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
    try {
      const { data } = await apiClient.post<ResetPasswordResponse>('/auth/reset-password', payload);
      return data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw new Error(getApiErrorMessage(error), { cause: error });
    }
  },

  me: async (): Promise<User> => {
    try {
      const { data } = await apiClient.get('/auth/me');
      return data;
    } catch (error) {
      console.error('Get user error:', error);
      throw new Error(getApiErrorMessage(error), { cause: error });
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw on logout
    } finally {
      useAuthStore.getState().logout();
      delete apiClient.defaults.headers.common.Authorization;
    }
  },
} as const;