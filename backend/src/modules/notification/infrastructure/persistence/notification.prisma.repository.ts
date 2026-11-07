import { Injectable } from '@nestjs/common';
import { Notification as PrismaNotification } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { NotificationEntity } from '../../domain/entities/notification.entity';

@Injectable()
export class NotificationPrismaRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    title: string;
    content: string;
    type: string;
  }): Promise<NotificationEntity> {
    const record = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        content: data.content,
        type: data.type,
      },
    });

    return {
      id: record.id,
      userId: record.userId,
      title: record.title,
      content: record.content,
      type: record.type,
      isRead: record.isRead,
      createdAt: record.createdAt,
    };
  }

  async findByUserId(
    userId: string,
    skip: number,
    take: number,
  ): Promise<{
    notifications: NotificationEntity[];
    total: number;
    unreadCount: number;
  }> {
    const [records, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({
        where: { userId },
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      notifications: records.map((record: PrismaNotification) => ({
        id: record.id,
        userId: record.userId,
        title: record.title,
        content: record.content,
        type: record.type,
        isRead: record.isRead,
        createdAt: record.createdAt,
      })),
      total,
      unreadCount,
    };
  }

  async markAsRead(id: string, userId: string): Promise<NotificationEntity | null> {
    const existing = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return null;
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      title: updated.title,
      content: updated.content,
      type: updated.type,
      isRead: updated.isRead,
      createdAt: updated.createdAt,
    };
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return result.count;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}

