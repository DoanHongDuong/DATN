import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { VOLUNTEER_REPOSITORY, IVolunteerRepository } from '../../domain/repositories/volunteer.repository.interface';
import { VolunteerProfileEntity } from '../../domain/entities/volunteer-profile.entity';

@Injectable()
export class UpdateVolunteerOnlineUseCase {
  constructor(
    @Inject(VOLUNTEER_REPOSITORY)
    private readonly volunteerRepo: IVolunteerRepository,
  ) {}

  async execute(userId: string, isOnline: boolean): Promise<VolunteerProfileEntity> {
    const profile = await this.volunteerRepo.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Không tìm thấy hồ sơ tình nguyện viên của bạn');
    }

    if (!profile.isVerified) {
      throw new ForbiddenException('Tài khoản tình nguyện viên chưa được xác thực (PB-29)');
    }

    return this.volunteerRepo.updateOnlineStatus(userId, isOnline);
  }
}
