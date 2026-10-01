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
 * UC-08 — Gửi tin nhắn trong phiên chat
 *
 * Flow:
 * 1. Kiểm tra session tồn tại và đang ACTIVE
 * 2. Kiểm tra senderId thuộc session (user hoặc volunteer)
 * 3. Lưu tin nhắn vào chat_messages
 */
@Injectable()
export class SendMessageUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: IChatRepository,
  ) {}

  async execute(senderId: string, sessionId: string, content: string) {
    const session = await this.chatRepository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên hỗ trợ');
    }

    if (session.status !== SessionStatus.ACTIVE) {
      throw new ForbiddenException('Phiên hỗ trợ chưa bắt đầu hoặc đã kết thúc');
    }

    // Chỉ user hoặc volunteer của session mới được gửi tin nhắn
    if (session.userId !== senderId && session.volunteerId !== senderId) {
      throw new ForbiddenException('Bạn không thuộc phiên hỗ trợ này');
    }

    return this.chatRepository.createMessage({
      sessionId,
      senderId,
      content,
    });
  }
}
