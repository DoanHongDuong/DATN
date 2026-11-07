import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  NOTIFICATION_REPOSITORY,
  INotificationRepository,
} from '../../domain/repositories/notification.repository.interface';
import { NotificationEntity } from '../../domain/entities/notification.entity';

@Injectable()
export class MarkNotificationReadUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepo: INotificationRepository,
  ) {}

  async execute(id: string, userId: string): Promise<NotificationEntity> {
    const updated = await this.notificationRepo.markAsRead(id, userId);
    if (!updated) {
      throw new NotFoundException('Thông báo không tồn tại hoặc không thuộc quyền sở hữu');
    }
    return updated;
  }
}

