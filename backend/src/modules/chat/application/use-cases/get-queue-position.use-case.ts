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

/**
 * PB-20 — Lấy vị trí trong hàng đợi
 *
 * Trả về số thứ tự của session trong queue (số phiên WAITING có priority >= và queued trước)
 */
@Injectable()
export class GetQueuePositionUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: IChatRepository,
  ) {}

  async execute(userId: string, sessionId: string) {
    const session = await this.chatRepository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên hỗ trợ');
    }

    // Chỉ user của session mới được xem vị trí
    if (session.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem thông tin phiên này');
    }

    if (session.status !== SessionStatus.WAITING) {
      return { position: 0, status: session.status };
    }

    const position = await this.chatRepository.getQueuePosition(sessionId);

    return { position, status: session.status };
  }
}
