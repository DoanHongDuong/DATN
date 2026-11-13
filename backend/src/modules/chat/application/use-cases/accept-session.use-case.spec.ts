import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { SessionStatus, PriorityLevel } from '@prisma/client';
import { AcceptSessionUseCase } from './accept-session.use-case';
import { IChatRepository } from '../../domain/repositories/chat.repository.interface';
import { CreateNotificationUseCase } from '../../../notification/application/use-cases/create-notification.use-case';

describe('AcceptSessionUseCase', () => {
  let useCase: AcceptSessionUseCase;
  let chatRepo: jest.Mocked<IChatRepository>;
  let createNotificationUseCase: jest.Mocked<CreateNotificationUseCase>;

  const mockWaitingSession = {
    id: 'session-200',
    userId: 'student-2',
    volunteerId: null,
    status: SessionStatus.WAITING,
    priorityLevel: PriorityLevel.CRITICAL,
    queuedAt: new Date(),
    startedAt: null,
    endedAt: null,
  };

  const mockAcceptedSession = {
    ...mockWaitingSession,
    status: SessionStatus.ACTIVE,
    volunteerId: 'vol-user-1',
    startedAt: new Date(),
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

    createNotificationUseCase = {
      execute: jest.fn().mockResolvedValue({
        id: 'notif-2',
        userId: 'student-2',
        title: 'Tình nguyện viên đã tiếp nhận phiên hỗ trợ',
        content: 'Content test',
        type: 'SESSION_ACCEPTED',
        isRead: false,
        createdAt: new Date(),
      }),
    } as unknown as jest.Mocked<CreateNotificationUseCase>;

    useCase = new AcceptSessionUseCase(chatRepo, createNotificationUseCase);
  });

  it('should throw ForbiddenException if volunteer is not verified', async () => {
    chatRepo.isVolunteerVerified.mockResolvedValue(false);

    await expect(
      useCase.execute('unverified-vol', 'session-200'),
    ).rejects.toThrow(ForbiddenException);
    expect(chatRepo.acceptSession).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException if session does not exist', async () => {
    chatRepo.isVolunteerVerified.mockResolvedValue(true);
    chatRepo.findSessionById.mockResolvedValue(null);

    await expect(
      useCase.execute('vol-user-1', 'non-existent-session'),
    ).rejects.toThrow(NotFoundException);
    expect(chatRepo.acceptSession).not.toHaveBeenCalled();
  });

  it('should throw ConflictException if session was already accepted by someone else', async () => {
    chatRepo.isVolunteerVerified.mockResolvedValue(true);
    chatRepo.findSessionById.mockResolvedValue(mockWaitingSession);
    chatRepo.acceptSession.mockResolvedValue(null); // Transaction trả về null do conflict

    await expect(
      useCase.execute('vol-user-1', 'session-200'),
    ).rejects.toThrow(ConflictException);
    expect(createNotificationUseCase.execute).not.toHaveBeenCalled();
  });

  it('should accept session successfully and notify the student', async () => {
    chatRepo.isVolunteerVerified.mockResolvedValue(true);
    chatRepo.findSessionById.mockResolvedValue(mockWaitingSession);
    chatRepo.acceptSession.mockResolvedValue(mockAcceptedSession);

    const result = await useCase.execute('vol-user-1', 'session-200');

    expect(result).toEqual(mockAcceptedSession);
    expect(chatRepo.acceptSession).toHaveBeenCalledWith('session-200', 'vol-user-1');
    expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'student-2',
        type: 'SESSION_ACCEPTED',
      }),
    );
  });
});

