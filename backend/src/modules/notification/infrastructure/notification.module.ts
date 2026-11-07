import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../../auth/infrastructure/auth.module';
import { NOTIFICATION_REPOSITORY } from '../domain/repositories/notification.repository.interface';
import { NotificationPrismaRepository } from './persistence/notification.prisma.repository';
import { CreateNotificationUseCase } from '../application/use-cases/create-notification.use-case';
import { GetUserNotificationsUseCase } from '../application/use-cases/get-user-notifications.use-case';
import { MarkNotificationReadUseCase } from '../application/use-cases/mark-notification-read.use-case';
import { MarkAllReadUseCase } from '../application/use-cases/mark-all-read.use-case';
import { NotificationController } from '../presentation/notification.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [NotificationController],
  providers: [
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: NotificationPrismaRepository,
    },
    CreateNotificationUseCase,
    GetUserNotificationsUseCase,
    MarkNotificationReadUseCase,
    MarkAllReadUseCase,
  ],
  exports: [
    NOTIFICATION_REPOSITORY,
    CreateNotificationUseCase,
  ],
})
export class NotificationModule {}

