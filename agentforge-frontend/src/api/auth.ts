import { apiClient } from './client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from '@/types/api';
import type { User } from '@/types/models';

export const authApi = {
  login: async (credentials: LoginRequest) => {
    const { data: tokens } = await apiClient.post<LoginResponse>(
      "/auth/login",
      credentials
    );

    apiClient.defaults.headers.common.Authorization =
      `Bearer ${tokens.access_token}`;

    const { data: user } = await apiClient.get<User>("/auth/me");

    return {
      ...tokens,
      user,
    };
  },

  register: async (payload: RegisterRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post('/auth/register', {
      email: payload.email,
      username: payload.email.split('@')[0],
      full_name: payload.name,
      password: payload.password,
    });
    return data;
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};