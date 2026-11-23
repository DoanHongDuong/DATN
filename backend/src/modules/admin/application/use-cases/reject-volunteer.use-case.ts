import { Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { ADMIN_REPOSITORY, IAdminRepository } from '../../domain/repositories/admin.repository.interface';
import { CreateNotificationUseCase } from '../../../notification/application/use-cases/create-notification.use-case';

@Injectable()
export class RejectVolunteerUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepo: IAdminRepository,
    @Optional()
    private readonly createNotificationUseCase?: CreateNotificationUseCase,
  ) {}

  async execute(actorId: string, profileId: string, reason?: string): Promise<{ message: string }> {
    const profile = await this.adminRepo.findVolunteerProfileById(profileId);
    if (!profile) {
      throw new NotFoundException('Không tìm thấy hồ sơ tình nguyện viên');
    }

    const targetUserId = profile.userId;
    const cleanReason = reason?.trim();
    await this.adminRepo.rejectVolunteer(actorId, profile.id, targetUserId, cleanReason);

    if (this.createNotificationUseCase) {
      const reasonText = cleanReason || 'Chưa đáp ứng đủ tiêu chuẩn xét duyệt đợt này (vui lòng bổ sung chứng chỉ PFA hoặc cập nhật kinh nghiệm).';
      const content = `Hồ sơ đăng ký làm Tình nguyện viên của bạn chưa được duyệt.\nLý do từ chối: ${reasonText}`;

      await this.createNotificationUseCase.execute({
        userId: targetUserId,
        title: 'Cập nhật hồ sơ tình nguyện viên',
        content,
        type: 'VOLUNTEER_REJECTED',
      }).catch(() => null);
    }

    return { message: 'Đã từ chối và xoá hồ sơ tình nguyện viên' };
  }
}
