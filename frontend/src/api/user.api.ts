import { apiClient } from './client';

export interface UserDetail {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
}

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
}

export const userApi = {
  getMe: async (): Promise<UserDetail> => {
    const res = await apiClient.get<UserDetail>('/users/me');
    return res.data;
  },

  updateMe: async (payload: UpdateProfilePayload): Promise<UserDetail> => {
    const res = await apiClient.patch<UserDetail>('/users/me', payload);
    return res.data;
  },
};
