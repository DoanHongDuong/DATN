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

  async execute(actorId: string, profileId: string): Promise<{ message: string }> {
    const profile = await this.adminRepo.findVolunteerProfileById(profileId);
    if (!profile) {
      throw new NotFoundException('Không tìm thấy hồ sơ tình nguyện viên');
    }

    const targetUserId = profile.userId;
    await this.adminRepo.rejectVolunteer(actorId, profile.id, targetUserId);

    if (this.createNotificationUseCase) {
      await this.createNotificationUseCase.execute({
        userId: targetUserId,
        title: 'Cập nhật hồ sơ tình nguyện viên',
        content: 'Rất tiếc, hồ sơ đăng ký làm Tình nguyện viên của bạn chưa đáp ứng đủ tiêu chuẩn xét duyệt đợt này.',
        type: 'VOLUNTEER_REJECTED',
      }).catch(() => null);
    }

    return { message: 'Đã từ chối và xoá hồ sơ tình nguyện viên' };
  }
}
