import { ConflictException } from '@nestjs/common';
import { SessionStatus, PriorityLevel, SeverityLevel } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { RequestSupportUseCase } from './request-support.use-case';
import { IChatRepository } from '../../domain/repositories/chat.repository.interface';
import { CreateNotificationUseCase } from '../../../notification/application/use-cases/create-notification.use-case';

describe('RequestSupportUseCase', () => {
  let useCase: RequestSupportUseCase;
  let chatRepo: jest.Mocked<IChatRepository>;
  let configService: jest.Mocked<ConfigService>;
  let createNotificationUseCase: jest.Mocked<CreateNotificationUseCase>;

  const mockSession = {
    id: 'session-100',
    userId: 'student-1',
    volunteerId: null,
    status: SessionStatus.WAITING,
    priorityLevel: PriorityLevel.HIGH,
    queuedAt: new Date(),
    startedAt: null,
    endedAt: null,
  };

  beforeEach(() => {
    chatRepo = {
      findActiveOrWaitingSessionByUserId: jest.fn(),
      findActiveSessionByVolunteerId: jest.fn(),
      findLatestSeverityByUserId: jest.fn(),
      hasAvailableVolunteer: jest.fn(),
      findAvailableVolunteerUserIds: jest.fn(),
      isVolunteerVerified: jest.fn(),
      createSession: jest.fn(),
      findSessionById: jest.fn(),
      acceptSession: jest.fn(),
      closeSession: jest.fn(),
      createMessage: jest.fn(),
      findMessagesBySessionId: jest.fn(),
      getQueuePosition: jest.fn(),
      findWaitingSessions: jest.fn(),
      createFeedback: jest.fn(),
      findFeedbackBySessionId: jest.fn(),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'EMERGENCY_HOTLINE') return '0979877220';
        return null;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    createNotificationUseCase = {
      execute: jest.fn().mockResolvedValue({
        id: 'notif-1',
        userId: 'vol-1',
        title: 'Có sinh viên vào hàng đợi tư vấn',
        content: 'Content test',
        type: 'NEW_WAITING_SESSION',
        isRead: false,
        createdAt: new Date(),
      }),
    } as unknown as jest.Mocked<CreateNotificationUseCase>;

    useCase = new RequestSupportUseCase(
      chatRepo,
      configService,
      createNotificationUseCase,
    );
  });

  it('should throw ConflictException if user already has an active or waiting session', async () => {
    chatRepo.findActiveOrWaitingSessionByUserId.mockResolvedValue(mockSession);

    await expect(useCase.execute('student-1')).rejects.toThrow(ConflictException);
    expect(chatRepo.createSession).not.toHaveBeenCalled();
  });

  it('should return hotline if no volunteer is available or verified', async () => {
    chatRepo.findActiveOrWaitingSessionByUserId.mockResolvedValue(null);
    chatRepo.hasAvailableVolunteer.mockResolvedValue(false);

    const result = await useCase.execute('student-1');

    expect(result).toEqual({
      noVolunteerAvailable: true,
      hotline: '0979877220',
    });
    expect(chatRepo.createSession).not.toHaveBeenCalled();
    expect(createNotificationUseCase.execute).not.toHaveBeenCalled();
  });

  it('should create waiting session and notify online volunteers based on severity mapping', async () => {
    chatRepo.findActiveOrWaitingSessionByUserId.mockResolvedValue(null);
    chatRepo.hasAvailableVolunteer.mockResolvedValue(true);
    chatRepo.findLatestSeverityByUserId.mockResolvedValue(SeverityLevel.MODERATELY_SEVERE);
    chatRepo.createSession.mockResolvedValue(mockSession);
    chatRepo.findAvailableVolunteerUserIds.mockResolvedValue(['vol-1', 'vol-2']);

    const result = await useCase.execute('student-1');

    expect(result.noVolunteerAvailable).toBe(false);
    expect(result.session).toEqual(mockSession);

    // MODERATELY_SEVERE should map to HIGH
    expect(chatRepo.createSession).toHaveBeenCalledWith({
      userId: 'student-1',
      priorityLevel: PriorityLevel.HIGH,
      status: SessionStatus.WAITING,
    });

    // Verify notifications sent to both available volunteers
    expect(chatRepo.findAvailableVolunteerUserIds).toHaveBeenCalledTimes(1);
    expect(createNotificationUseCase.execute).toHaveBeenCalledTimes(2);
    expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'vol-1',
        type: 'NEW_WAITING_SESSION',
      }),
    );
    expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'vol-2',
        type: 'NEW_WAITING_SESSION',
      }),
    );
  });
});

