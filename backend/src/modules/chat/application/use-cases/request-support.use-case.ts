import { Injectable, Inject, ConflictException, ForbiddenException, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SessionStatus, Role } from '@prisma/client';
import {
  CHAT_REPOSITORY,
  IChatRepository,
} from '../../domain/repositories/chat.repository.interface';
import {
  SEVERITY_TO_PRIORITY_MAP,
  DEFAULT_PRIORITY_LEVEL,
} from '../../infrastructure/constants/priority-mapping.constant';
import { CreateNotificationUseCase } from '../../../notification/application/use-cases/create-notification.use-case';

/**
 * UC-06 — Yêu cầu hỗ trợ tâm lý (REST, không phải Socket)
 *
 * Flow:
 * 1. Phân tách vai trò (SoD): Chỉ USER mới được tạo yêu cầu tư vấn. ADMIN và VOLUNTEER bị chặn.
 * 2. Kiểm tra user không có phiên WAITING/ACTIVE (1 user = 1 phiên tại 1 thời điểm)
 * 3. Kiểm tra có TNV online & verified hay không
 *    - KHÔNG → trả về { noVolunteerAvailable: true, hotline }
 *    - CÓ    → map severity → priority, tạo session status=WAITING
 * 4. Tạo thông báo cho các TNV đang trực tuyến
 */
@Injectable()
export class RequestSupportUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: IChatRepository,
    private readonly configService: ConfigService,
    @Optional()
    private readonly createNotificationUseCase?: CreateNotificationUseCase,
  ) {}

  async execute(userId: string, role?: string) {
    // Business rule: Phân tách vai trò (Separation of Duties). Chỉ sinh viên/người dùng (USER) mới tạo phiên tư vấn.
    if (role && (role === Role.ADMIN || role === Role.VOLUNTEER)) {
      throw new ForbiddenException(
        'Tài khoản Quản trị viên và Tình nguyện viên không thể tạo yêu cầu tư vấn trên kênh sinh viên. Vui lòng sử dụng tài khoản Người dùng (USER) để thử nghiệm.',
      );
    }

    // Business rule: 1 người chỉ 1 phiên tại 1 thời điểm
    const existingSession =
      await this.chatRepository.findActiveOrWaitingSessionByUserId(userId);
    if (existingSession) {
      throw new ConflictException(
        'Bạn đang có một phiên hỗ trợ chưa kết thúc. Vui lòng đợi hoặc kết thúc phiên hiện tại.',
      );
    }

    // Kiểm tra có TNV nào sẵn sàng không
    const hasVolunteer = await this.chatRepository.hasAvailableVolunteer();
    if (!hasVolunteer) {
      const rawHotline = this.configService.get<string>('EMERGENCY_HOTLINE')?.replace(/^["']|["']$/g, '').trim();
      const hotline = (rawHotline && rawHotline !== '1900 6789' && rawHotline !== '0979877220') ? rawHotline : '1900 6299';
      return {
        noVolunteerAvailable: true,
        hotline,
      };
    }

    // Lấy severity gần nhất → map sang priority
    const latestSeverity =
      await this.chatRepository.findLatestSeverityByUserId(userId);
    const priorityLevel = latestSeverity
      ? SEVERITY_TO_PRIORITY_MAP[latestSeverity]
      : DEFAULT_PRIORITY_LEVEL;

    const session = await this.chatRepository.createSession({
      userId,
      priorityLevel,
      status: SessionStatus.WAITING,
    });

    // Tạo thông báo cho các TNV trực tuyến (loại trừ chính người gửi nếu là TNV tự test)
    if (this.createNotificationUseCase) {
      const volunteerUserIds = await this.chatRepository.findAvailableVolunteerUserIds();
      const targetVolunteerIds = volunteerUserIds.filter((vId) => vId !== userId);
      await Promise.allSettled(
        targetVolunteerIds.map((vId) =>
          this.createNotificationUseCase!.execute({
            userId: vId,
            title: 'Có sinh viên vào hàng đợi tư vấn',
            content: `Một sinh viên vừa gửi yêu cầu hỗ trợ với mức ưu tiên: ${priorityLevel}. Hãy tiếp nhận phiên ngay.`,
            type: 'NEW_WAITING_SESSION',
          }),
        ),
      );
    }

    return {
      noVolunteerAvailable: false,
      session,
    };
  }
}
