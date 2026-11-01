import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { SessionStatus } from '@prisma/client';
import {
  CHAT_REPOSITORY,
  IChatRepository,
} from '../../domain/repositories/chat.repository.interface';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { SessionFeedbackEntity } from '../../domain/entities/session-feedback.entity';

@Injectable()
export class SubmitSessionFeedbackUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: IChatRepository,
  ) {}

  async execute(
    userId: string,
    sessionId: string,
    dto: CreateFeedbackDto,
  ): Promise<SessionFeedbackEntity> {
    const session = await this.chatRepository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên hỗ trợ');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền đánh giá phiên hỗ trợ này');
    }

    if (session.status !== SessionStatus.CLOSED) {
      throw new BadRequestException('Chỉ có thể đánh giá phiên hỗ trợ đã kết thúc');
    }

    const existingFeedback = await this.chatRepository.findFeedbackBySessionId(sessionId);
    if (existingFeedback) {
      throw new ConflictException('Bạn đã gửi đánh giá cho phiên hỗ trợ này rồi');
    }

    return this.chatRepository.createFeedback({
      sessionId,
      rating: dto.rating,
      comment: dto.comment?.trim() || null,
    });
  }
}

