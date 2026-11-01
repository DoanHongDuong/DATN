import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  CHAT_REPOSITORY,
  IChatRepository,
} from '../../domain/repositories/chat.repository.interface';
import { SessionFeedbackEntity } from '../../domain/entities/session-feedback.entity';

@Injectable()
export class GetSessionFeedbackUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: IChatRepository,
  ) {}

  async execute(
    userId: string,
    sessionId: string,
  ): Promise<SessionFeedbackEntity | null> {
    const session = await this.chatRepository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên hỗ trợ');
    }

    if (session.userId !== userId && session.volunteerId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem đánh giá của phiên này');
    }

    return this.chatRepository.findFeedbackBySessionId(sessionId);
  }
}

