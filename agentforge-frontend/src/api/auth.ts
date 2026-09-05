import { apiClient, getApiErrorMessage } from './client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from '@/types/api';
import type { User } from '@/types/models';

export const authApi = {
  login: async (credentials: LoginRequest) => {
    try {
      console.log('Attempting login...');
      
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
    }
  },
};