import { Inject, Injectable } from '@nestjs/common';
import {
  NOTIFICATION_REPOSITORY,
  INotificationRepository,
} from '../../domain/repositories/notification.repository.interface';

@Injectable()
export class MarkAllReadUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepo: INotificationRepository,
  ) {}

  async execute(userId: string): Promise<{ count: number; message: string }> {
    const count = await this.notificationRepo.markAllAsRead(userId);
    return {
      count,
      message: `Đã đánh dấu ${count} thông báo là đã đọc`,
    };
  }
}

