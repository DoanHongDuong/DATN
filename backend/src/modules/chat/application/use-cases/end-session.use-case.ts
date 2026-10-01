import {
  Injectable,
  Inject,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SessionStatus } from '@prisma/client';
import {
  CHAT_REPOSITORY,
  IChatRepository,
} from '../../domain/repositories/chat.repository.interface';

/**
 * UC-08 — Kết thúc phiên chat (chỉ TNV mới được end)
 *
 * Flow:
 * 1. Kiểm tra session tồn tại, đang ACTIVE
 * 2. Kiểm tra volunteerId đúng là TNV của session này
 * 3. Update status=CLOSED, ended_at
 */
@Injectable()
export class EndSessionUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: IChatRepository,
  ) {}

  async execute(volunteerId: string, sessionId: string) {
    const session = await this.chatRepository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên hỗ trợ');
    }

    if (session.status !== SessionStatus.ACTIVE) {
      throw new ForbiddenException('Phiên hỗ trợ chưa bắt đầu hoặc đã kết thúc');
    }

    if (session.volunteerId !== volunteerId) {
      throw new ForbiddenException(
        'Chỉ tình nguyện viên của phiên này mới có quyền kết thúc',
      );
    }

    return this.chatRepository.closeSession(sessionId);
  }
}
