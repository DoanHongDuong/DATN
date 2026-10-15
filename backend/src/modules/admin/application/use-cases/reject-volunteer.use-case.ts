import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ADMIN_REPOSITORY, IAdminRepository } from '../../domain/repositories/admin.repository.interface';

@Injectable()
export class RejectVolunteerUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepo: IAdminRepository,
  ) {}

  async execute(actorId: string, profileId: string): Promise<{ message: string }> {
    const profile = await this.adminRepo.findVolunteerProfileById(profileId);
    if (!profile) {
      throw new NotFoundException('Không tìm thấy hồ sơ tình nguyện viên');
    }

    await this.adminRepo.rejectVolunteer(actorId, profile.id, profile.userId);
    return { message: 'Đã từ chối và xoá hồ sơ tình nguyện viên' };
  }
}
