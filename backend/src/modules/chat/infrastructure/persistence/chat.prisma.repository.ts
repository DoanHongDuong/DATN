import { Injectable } from '@nestjs/common';
import {
  ChatSession,
  ChatMessage,
  SessionStatus,
  PriorityLevel,
  SeverityLevel,
} from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { IChatRepository } from '../../domain/repositories/chat.repository.interface';

/**
 * Prisma-based implementation of IChatRepository.
 * Tất cả logic truy vấn DB nằm ở đây — domain/application layer không biết Prisma.
 */
@Injectable()
export class ChatPrismaRepository implements IChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findActiveOrWaitingSessionByUserId(
    userId: string,
  ): Promise<ChatSession | null> {
    return this.prisma.chatSession.findFirst({
      where: {
        userId,
        status: { in: [SessionStatus.WAITING, SessionStatus.ACTIVE] },
      },
    });
  }

  async findLatestSeverityByUserId(
    userId: string,
  ): Promise<SeverityLevel | null> {
    const result = await this.prisma.testResult.findFirst({
      where: { userId },
      orderBy: { takenAt: 'desc' },
      select: { severityLevel: true },
    });
    return result?.severityLevel ?? null;
  }

  async hasAvailableVolunteer(): Promise<boolean> {
    const count = await this.prisma.volunteerProfile.count({
      where: {
        isOnline: true,
        isVerified: true,
      },
    });
    return count > 0;
  }

  async createSession(data: {
    userId: string;
    priorityLevel: PriorityLevel;
    status: SessionStatus;
  }): Promise<ChatSession> {
    return this.prisma.chatSession.create({
      data: {
        userId: data.userId,
        priorityLevel: data.priorityLevel,
        status: data.status,
      },
    });
  }

  async findSessionById(sessionId: string): Promise<ChatSession | null> {
    if (!sessionId) {
      return null;
    }
    return this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });
  }

  /**
   * Accept phiên dùng interactive transaction để tránh race condition.
   * Kiểm tra session vẫn WAITING + volunteer_id = null trước khi update.
   * Trả về null nếu đã bị người khác nhận.
   */
  async acceptSession(
    sessionId: string,
    volunteerId: string,
  ): Promise<ChatSession | null> {
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.chatSession.findUnique({
        where: { id: sessionId },
      });

      if (
        !session ||
        session.status !== SessionStatus.WAITING ||
        session.volunteerId !== null
      ) {
        return null;
      }

      return tx.chatSession.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.ACTIVE,
          volunteerId,
          startedAt: new Date(),
        },
      });
    });
  }

  async closeSession(sessionId: string): Promise<ChatSession> {
    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.CLOSED,
        endedAt: new Date(),
      },
    });
  }

  async createMessage(data: {
    sessionId: string;
    senderId: string;
    content: string;
  }): Promise<ChatMessage> {
    return this.prisma.chatMessage.create({
      data: {
        sessionId: data.sessionId,
        senderId: data.senderId,
        content: data.content,
      },
    });
  }

  async findMessagesBySessionId(sessionId: string): Promise<ChatMessage[]> {
    if (!sessionId) {
      return [];
    }
    return this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { sentAt: 'asc' },
    });
  }

  /**
   * Tính vị trí trong hàng đợi.
   * Priority order: CRITICAL > HIGH > MEDIUM > LOW
   * Trong cùng priority, ai queued trước thì đứng trước.
   */
  async getQueuePosition(sessionId: string): Promise<number> {
    if (!sessionId) {
      return 0;
    }
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.status !== SessionStatus.WAITING) {
      return 0;
    }

    // Thứ tự ưu tiên: priority cao hơn đứng trước, cùng priority thì queued trước
    const PRIORITY_ORDER: Record<PriorityLevel, number> = {
      [PriorityLevel.CRITICAL]: 4,
      [PriorityLevel.HIGH]: 3,
      [PriorityLevel.MEDIUM]: 2,
      [PriorityLevel.LOW]: 1,
    };

    const currentPriorityValue = PRIORITY_ORDER[session.priorityLevel];

    // Đếm các phiên WAITING đứng trước trong hàng đợi:
    // 1. Priority cao hơn, HOẶC
    // 2. Cùng priority nhưng queued trước
    const waitingSessions = await this.prisma.chatSession.findMany({
      where: {
        status: SessionStatus.WAITING,
        id: { not: sessionId },
      },
      select: { priorityLevel: true, queuedAt: true },
    });

    let position = 1; // Bắt đầu từ vị trí 1
    for (const s of waitingSessions) {
      const sPriorityValue = PRIORITY_ORDER[s.priorityLevel];
      if (
        sPriorityValue > currentPriorityValue ||
        (sPriorityValue === currentPriorityValue &&
          s.queuedAt < session.queuedAt)
      ) {
        position++;
      }
    }

    return position;
  }
}
