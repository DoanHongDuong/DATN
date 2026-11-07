import { CreateNotificationUseCase } from './create-notification.use-case';
import { GetUserNotificationsUseCase } from './get-user-notifications.use-case';
import { MarkNotificationReadUseCase } from './mark-notification-read.use-case';
import { MarkAllReadUseCase } from './mark-all-read.use-case';
import { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { NotificationEntity } from '../../domain/entities/notification.entity';
import { NotFoundException } from '@nestjs/common';

describe('Notification Use Cases', () => {
  let mockRepository: jest.Mocked<INotificationRepository>;
  let createUseCase: CreateNotificationUseCase;
  let getNotificationsUseCase: GetUserNotificationsUseCase;
  let markReadUseCase: MarkNotificationReadUseCase;
  let markAllReadUseCase: MarkAllReadUseCase;

  const mockNotification: NotificationEntity = {
    id: 'notif-123',
    userId: 'user-456',
    title: 'Hồ sơ tình nguyện viên đã được duyệt',
    content: 'Chúc mừng! Hồ sơ tình nguyện viên của bạn đã được kiểm duyệt thành công.',
    type: 'VOLUNTEER_APPROVED',
    isRead: false,
    createdAt: new Date('2026-11-03T10:00:00Z'),
  };

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      getUnreadCount: jest.fn(),
    };

    createUseCase = new CreateNotificationUseCase(mockRepository);
    getNotificationsUseCase = new GetUserNotificationsUseCase(mockRepository);
    markReadUseCase = new MarkNotificationReadUseCase(mockRepository);
    markAllReadUseCase = new MarkAllReadUseCase(mockRepository);
  });

  describe('CreateNotificationUseCase', () => {
    it('should create and return a notification', async () => {
      mockRepository.create.mockResolvedValue(mockNotification);

      const result = await createUseCase.execute({
        userId: 'user-456',
        title: 'Hồ sơ tình nguyện viên đã được duyệt',
        content: 'Chúc mừng! Hồ sơ tình nguyện viên của bạn đã được kiểm duyệt thành công.',
        type: 'VOLUNTEER_APPROVED',
      });

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 'user-456',
        title: 'Hồ sơ tình nguyện viên đã được duyệt',
        content: 'Chúc mừng! Hồ sơ tình nguyện viên của bạn đã được kiểm duyệt thành công.',
        type: 'VOLUNTEER_APPROVED',
      });
      expect(result).toEqual(mockNotification);
    });
  });

  describe('GetUserNotificationsUseCase', () => {
    it('should return paginated notifications and unread count', async () => {
      mockRepository.findByUserId.mockResolvedValue({
        notifications: [mockNotification],
        total: 1,
        unreadCount: 1,
      });

      const result = await getNotificationsUseCase.execute('user-456', 1, 10);

      expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-456', 0, 10);
      expect(result).toEqual({
        notifications: [mockNotification],
        total: 1,
        unreadCount: 1,
        page: 1,
        limit: 10,
      });
    });

    it('should return unread count via getUnreadCount', async () => {
      mockRepository.getUnreadCount.mockResolvedValue(3);

      const count = await getNotificationsUseCase.getUnreadCount('user-456');

      expect(mockRepository.getUnreadCount).toHaveBeenCalledWith('user-456');
      expect(count).toBe(3);
    });
  });

  describe('MarkNotificationReadUseCase', () => {
    it('should mark a notification as read', async () => {
      const updatedNotif = { ...mockNotification, isRead: true };
      mockRepository.markAsRead.mockResolvedValue(updatedNotif);

      const result = await markReadUseCase.execute('notif-123', 'user-456');

      expect(mockRepository.markAsRead).toHaveBeenCalledWith('notif-123', 'user-456');
      expect(result.isRead).toBe(true);
    });

    it('should throw NotFoundException if notification not found or belongs to another user', async () => {
      mockRepository.markAsRead.mockResolvedValue(null);

      await expect(
        markReadUseCase.execute('notif-999', 'user-456'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('MarkAllReadUseCase', () => {
    it('should mark all notifications as read and return affected count', async () => {
      mockRepository.markAllAsRead.mockResolvedValue(5);

      const result = await markAllReadUseCase.execute('user-456');

      expect(mockRepository.markAllAsRead).toHaveBeenCalledWith('user-456');
      expect(result).toEqual({
        count: 5,
        message: 'Đã đánh dấu 5 thông báo là đã đọc',
      });
    });
  });
});

