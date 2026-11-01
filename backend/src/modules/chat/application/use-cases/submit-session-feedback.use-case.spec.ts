import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { SessionStatus, PriorityLevel } from '@prisma/client';
import { SubmitSessionFeedbackUseCase } from './submit-session-feedback.use-case';
import { IChatRepository } from '../../domain/repositories/chat.repository.interface';
import { SessionFeedbackEntity } from '../../domain/entities/session-feedback.entity';

describe('SubmitSessionFeedbackUseCase', () => {
  let useCase: SubmitSessionFeedbackUseCase;
  let chatRepo: jest.Mocked<IChatRepository>;

  const mockClosedSession = {
    id: 'session-1',
    userId: 'user-1',
    volunteerId: 'volunteer-1',
    status: SessionStatus.CLOSED,
    priorityLevel: PriorityLevel.MEDIUM,
    queuedAt: new Date(),
    startedAt: new Date(),
    endedAt: new Date(),
  };

  beforeEach(() => {
    chatRepo = {
      findActiveOrWaitingSessionByUserId: jest.fn(),
      findActiveSessionByVolunteerId: jest.fn(),
      findLatestSeverityByUserId: jest.fn(),
      hasAvailableVolunteer: jest.fn(),
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

    useCase = new SubmitSessionFeedbackUseCase(chatRepo);
  });

  it('should throw NotFoundException if session does not exist', async () => {
    chatRepo.findSessionById.mockResolvedValue(null);

    await expect(
      useCase.execute('user-1', 'session-1', { rating: 5 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ForbiddenException if user is not session.userId', async () => {
    chatRepo.findSessionById.mockResolvedValue(mockClosedSession);

    await expect(
      useCase.execute('other-user', 'session-1', { rating: 5 }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw BadRequestException if session is not CLOSED', async () => {
    chatRepo.findSessionById.mockResolvedValue({
      ...mockClosedSession,
      status: SessionStatus.ACTIVE,
    });

    await expect(
      useCase.execute('user-1', 'session-1', { rating: 5 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw ConflictException if feedback already exists', async () => {
    chatRepo.findSessionById.mockResolvedValue(mockClosedSession);
    chatRepo.findFeedbackBySessionId.mockResolvedValue({
      id: 'fb-1',
      sessionId: 'session-1',
      rating: 4,
      comment: 'Cảm ơn',
      createdAt: new Date(),
    });

    await expect(
      useCase.execute('user-1', 'session-1', { rating: 5 }),
    ).rejects.toThrow(ConflictException);
  });

  it('should create feedback successfully when all validations pass', async () => {
    chatRepo.findSessionById.mockResolvedValue(mockClosedSession);
    chatRepo.findFeedbackBySessionId.mockResolvedValue(null);

    const createdFeedback: SessionFeedbackEntity = {
      id: 'fb-1',
      sessionId: 'session-1',
      rating: 5,
      comment: 'Tình nguyện viên lắng nghe rất nhiệt tình và thấu cảm!',
      createdAt: new Date(),
    };
    chatRepo.createFeedback.mockResolvedValue(createdFeedback);

    const result = await useCase.execute('user-1', 'session-1', {
      rating: 5,
      comment: '  Tình nguyện viên lắng nghe rất nhiệt tình và thấu cảm!  ',
    });

    expect(chatRepo.createFeedback).toHaveBeenCalledWith({
      sessionId: 'session-1',
      rating: 5,
      comment: 'Tình nguyện viên lắng nghe rất nhiệt tình và thấu cảm!',
    });
    expect(result).toEqual(createdFeedback);
  });
});

