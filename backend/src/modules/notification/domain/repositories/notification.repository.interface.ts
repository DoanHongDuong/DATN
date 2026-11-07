import { NotificationEntity } from '../entities/notification.entity';

export const NOTIFICATION_REPOSITORY = 'NOTIFICATION_REPOSITORY';

export interface INotificationRepository {
  create(data: {
    userId: string;
    title: string;
    content: string;
    type: string;
  }): Promise<NotificationEntity>;

  findByUserId(
    userId: string,
    skip: number,
    take: number,
  ): Promise<{
    notifications: NotificationEntity[];
    total: number;
    unreadCount: number;
  }>;

  markAsRead(id: string, userId: string): Promise<NotificationEntity | null>;

  markAllAsRead(userId: string): Promise<number>;

  getUnreadCount(userId: string): Promise<number>;
}

