import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ADMIN_REPOSITORY, IAdminRepository } from '../../domain/repositories/admin.repository.interface';

@Injectable()
export class ApproveVolunteerUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepo: IAdminRepository,
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
    return { message: 'Phê duyệt hồ sơ tình nguyện viên thành công' };
  }
}
