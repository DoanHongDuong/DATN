import { apiClient } from './client';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface GetNotificationsResponse {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

export const notificationApi = {
  getNotifications: async (page = 1, limit = 20): Promise<GetNotificationsResponse> => {
    const res = await apiClient.get<GetNotificationsResponse>('/notifications', {
      params: { page, limit },
    });
    return res.data;
  },

  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    const res = await apiClient.get<{ unreadCount: number }>('/notifications/unread-count');
    return res.data;
  },

  markAsRead: async (id: string): Promise<NotificationItem> => {
    const res = await apiClient.patch<NotificationItem>(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async (): Promise<{ count: number; message: string }> => {
    const res = await apiClient.patch<{ count: number; message: string }>('/notifications/read-all');
    return res.data;
  },
};

