import { Inject, Injectable, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { ADMIN_REPOSITORY, IAdminRepository } from '../../domain/repositories/admin.repository.interface';
import { CreateNotificationUseCase } from '../../../notification/application/use-cases/create-notification.use-case';

@Injectable()
export class ApproveVolunteerUseCase {
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
    if (profile.isVerified) {
      throw new BadRequestException('Hồ sơ tình nguyện viên này đã được duyệt');
    }

    await this.adminRepo.approveVolunteer(actorId, profile.id, profile.userId);

    if (this.createNotificationUseCase) {
      await this.createNotificationUseCase.execute({
        userId: profile.userId,
        title: 'Hồ sơ tình nguyện viên đã được phê duyệt',
        content: 'Chúc mừng! Hồ sơ tình nguyện viên của bạn đã được kiểm duyệt thành công. Bạn đã có thể bắt đầu nhận ca và hỗ trợ các bạn sinh viên.',
        type: 'VOLUNTEER_APPROVED',
      }).catch(() => null);
    }

    return { message: 'Phê duyệt hồ sơ tình nguyện viên thành công' };
  }
}
