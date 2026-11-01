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

export interface AdminRelaxationResource {
  id: string;
  title: string;
  type: string;
  url: string;
  durationSeconds: number | null;
  category: string;
  createdAt: string;
}

export interface CreateResourcePayload {
  title: string;
  type: string;
  url: string;
  durationSeconds?: number | null;
  category: string;
}

export interface UpdateResourcePayload {
  title?: string;
  type?: string;
  url?: string;
  durationSeconds?: number | null;
  category?: string;
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

  getResources: async (category?: string): Promise<AdminRelaxationResource[]> => {
    const res = await apiClient.get<AdminRelaxationResource[]>('/admin/resources', {
      params: category && category !== 'all' ? { category } : undefined,
    });
    return res.data;
  },

  createResource: async (payload: CreateResourcePayload): Promise<AdminRelaxationResource> => {
    const res = await apiClient.post<AdminRelaxationResource>('/admin/resources', payload);
    return res.data;
  },

  updateResource: async (id: string, payload: UpdateResourcePayload): Promise<AdminRelaxationResource> => {
    const res = await apiClient.put<AdminRelaxationResource>(`/admin/resources/${id}`, payload);
    return res.data;
  },

  deleteResource: async (id: string): Promise<{ message?: string }> => {
    const res = await apiClient.delete<{ message?: string }>(`/admin/resources/${id}`);
    return res.data;
  },

  getAuditLogs: async (params?: GetAuditLogsParams): Promise<PaginatedAuditLogs> => {
    const res = await apiClient.get<PaginatedAuditLogs>('/admin/audit-logs', { params });
    return res.data;
  },

  getStats: async (): Promise<SystemStats> => {
    const res = await apiClient.get<SystemStats>('/admin/stats');
    return res.data;
  },
};

export interface SystemStats {
  users: {
    total: number;
    members: number;
    volunteers: number;
    admins: number;
    active: number;
    blocked: number;
    onlineVolunteers: number;
    pendingVolunteers: number;
  };
  sessions: {
    total: number;
    waiting: number;
    active: number;
    closed: number;
    totalFeedbacks: number;
    averageRating: number;
  };
  assessments: {
    total: number;
    severityDistribution: {
      minimal: number;
      mild: number;
      moderate: number;
      moderatelySevere: number;
      severe: number;
    };
  };
  journals: {
    total: number;
    sentimentDistribution: {
      positive: number;
      neutral: number;
      negative: number;
      crisis: number;
    };
  };
  resources: {
    total: number;
  };
  recentActivity: Array<{
    date: string;
    sessions: number;
    assessments: number;
    journals: number;
  }>;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  targetId: string | null;
  description: string | null;
  createdAt: string;
  actor: {
    fullName: string;
    email: string;
  };
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
  action?: string;
  from?: string;
  to?: string;
}
