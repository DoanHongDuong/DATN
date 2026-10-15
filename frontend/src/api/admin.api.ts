import { apiClient } from './client';

export interface PendingVolunteer {
  id: string;
  userId: string;
  specialization: string | null;
  bio: string | null;
  certificateUrl: string | null;
  isVerified: boolean;
  isOnline: boolean;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
  };
}

export interface AdminUser {
  id: string;
  role: 'USER' | 'VOLUNTEER' | 'ADMIN';
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedUsers {
  items: AdminUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const adminApi = {
  getPendingVolunteers: async (): Promise<PendingVolunteer[]> => {
    const res = await apiClient.get<PendingVolunteer[]>('/admin/volunteers/pending');
    return res.data;
  },

  approveVolunteer: async (profileId: string): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>(`/admin/volunteers/${profileId}/approve`);
    return res.data;
  },

  rejectVolunteer: async (profileId: string): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>(`/admin/volunteers/${profileId}/reject`);
    return res.data;
  },

  getUsers: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedUsers> => {
    const res = await apiClient.get<PaginatedUsers>('/admin/users', { params });
    return res.data;
  },

  updateUserStatus: async (id: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<AdminUser> => {
    const res = await apiClient.patch<AdminUser>(`/admin/users/${id}/status`, { status });
    return res.data;
  },
};
