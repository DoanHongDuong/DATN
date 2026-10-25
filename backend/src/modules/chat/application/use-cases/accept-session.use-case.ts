import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  CHAT_REPOSITORY,
  IChatRepository,
} from '../../domain/repositories/chat.repository.interface';

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

    return acceptedSession;
  }
}
