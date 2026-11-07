import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import {
  CHAT_REPOSITORY,
  IChatRepository,
} from '../../domain/repositories/chat.repository.interface';
import { CreateNotificationUseCase } from '../../../notification/application/use-cases/create-notification.use-case';

/**
 * UC-07 — TNV nhận phiên hỗ trợ (REST)
 *
 * Flow:
 * 1. Kiểm tra TNV đã được xác thực (isVerified = true) — AGENTS.md
 * 2. Dùng Prisma transaction (trong repository) kiểm tra session vẫn WAITING
 *    VÀ volunteer_id vẫn NULL trước khi update → tránh race condition
 * 3. Update status=ACTIVE, volunteer_id, started_at
 * 4. Trả về session đã cập nhật để controller/gateway có thể emit sự kiện
 */
@Injectable()
export class AcceptSessionUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: IChatRepository,
    @Optional()
    private readonly createNotificationUseCase?: CreateNotificationUseCase,
  ) {}

  async execute(volunteerId: string, sessionId: string) {
    // Kiểm tra TNV đã được xác thực chính thức chưa (AGENTS.md)
    const isVerified = await this.chatRepository.isVolunteerVerified(volunteerId);
    if (!isVerified) {
      throw new ForbiddenException('Tài khoản tình nguyện viên chưa được duyệt hồ sơ xác thực');
    }

    // Kiểm tra session tồn tại
    const session = await this.chatRepository.findSessionById(sessionId);
    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên hỗ trợ');
    }

    // Dùng transaction trong repository để accept — race-condition safe
    const acceptedSession = await this.chatRepository.acceptSession(
      sessionId,
      volunteerId,
    );

    if (!acceptedSession) {
      throw new ConflictException('Phiên đã được nhận bởi người khác');
    }

    if (this.createNotificationUseCase) {
      await this.createNotificationUseCase.execute({
        userId: acceptedSession.userId,
        title: 'Tình nguyện viên đã tiếp nhận phiên hỗ trợ',
        content: 'Một tình nguyện viên vừa tiếp nhận yêu cầu hỗ trợ của bạn. Hãy vào phòng chat để bắt đầu.',
        type: 'SESSION_ACCEPTED',
      }).catch(() => null);
    }

    return acceptedSession;
  }
}
