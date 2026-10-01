import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SessionStatus } from '@prisma/client';
import {
  CHAT_REPOSITORY,
  IChatRepository,
} from '../../domain/repositories/chat.repository.interface';
import {
  SEVERITY_TO_PRIORITY_MAP,
  DEFAULT_PRIORITY_LEVEL,
} from '../../infrastructure/constants/priority-mapping.constant';

/**
 * UC-06 — Yêu cầu hỗ trợ tâm lý (REST, không phải Socket)
 *
 * Flow:
 * 1. Kiểm tra user không có phiên WAITING/ACTIVE (1 user = 1 phiên tại 1 thời điểm)
 * 2. Kiểm tra có TNV online & verified hay không
 *    - KHÔNG → trả về { noVolunteerAvailable: true, hotline }
 *    - CÓ    → map severity → priority, tạo session status=WAITING
 */
@Injectable()
export class RequestSupportUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: IChatRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(userId: string) {
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
      return {
        noVolunteerAvailable: true,
        hotline: this.configService.get<string>('EMERGENCY_HOTLINE'),
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

    return {
      noVolunteerAvailable: false,
      session,
    };
  }
}
