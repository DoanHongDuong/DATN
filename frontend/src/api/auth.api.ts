import { apiClient } from './client';

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export interface RegisterResponse {
  id: string;
  email: string;
  fullName: string;
  role: string;
  message: string;
}

export interface UserProfile {
  userId: string;
  role: string;
}

export interface VerifyEmailPayload {
  email: string;
  token: string;
}

export interface ResetPasswordPayload {
  email: string;
  token: string;
  newPassword: string;
  confirmNewPassword: string;
}

export const authApi = {
  register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
    const res = await apiClient.post('/auth/register', payload);
    return res.data;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await apiClient.post('/auth/login', payload);
    return res.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },

  verifyEmail: async (payload: VerifyEmailPayload): Promise<{ message: string }> => {
    const res = await apiClient.post('/auth/verify-email', payload);
    return res.data;
  },

  resendVerification: async (email: string): Promise<{ message: string }> => {
    const res = await apiClient.post('/auth/resend-verification', { email });
    return res.data;
  },

  resetPassword: async (payload: ResetPasswordPayload): Promise<{ message: string }> => {
    const res = await apiClient.post('/auth/reset-password', payload);
    return res.data;
  },

  getMe: async (): Promise<UserProfile> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};
