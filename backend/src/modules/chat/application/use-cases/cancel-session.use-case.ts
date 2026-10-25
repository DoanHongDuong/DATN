import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SessionStatus } from '@prisma/client';
import {
  CHAT_REPOSITORY,
  IChatRepository,
} from '../../domain/repositories/chat.repository.interface';

@Injectable()
export class CancelSessionUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: IChatRepository,
  ) {}

  async execute(userId: string, sessionId: string) {
    const session = await this.chatRepository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên hỗ trợ');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền huỷ phiên hỗ trợ này');
    }

    if (session.status !== SessionStatus.WAITING && session.status !== SessionStatus.ACTIVE) {
      throw new ForbiddenException('Phiên hỗ trợ đã kết thúc hoặc không thể huỷ');
    }

    return this.chatRepository.closeSession(sessionId);
  }
}
