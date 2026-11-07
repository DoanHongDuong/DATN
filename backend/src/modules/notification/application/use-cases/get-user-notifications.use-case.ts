import { Inject, Injectable } from '@nestjs/common';
import {
  NOTIFICATION_REPOSITORY,
  INotificationRepository,
} from '../../domain/repositories/notification.repository.interface';
import { NotificationEntity } from '../../domain/entities/notification.entity';

export interface GetUserNotificationsResult {
  notifications: NotificationEntity[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

@Injectable()
export class GetUserNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepo: INotificationRepository,
  ) {}

  async execute(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<GetUserNotificationsResult> {
    const validPage = Math.max(1, page);
    const validLimit = Math.min(50, Math.max(1, limit));
    const skip = (validPage - 1) * validLimit;

    const { notifications, total, unreadCount } =
      await this.notificationRepo.findByUserId(userId, skip, validLimit);

    return {
      notifications,
      total,
      unreadCount,
      page: validPage,
      limit: validLimit,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.getUnreadCount(userId);
  }
}

