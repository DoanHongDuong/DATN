import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { VOLUNTEER_REPOSITORY, IVolunteerRepository } from '../../domain/repositories/volunteer.repository.interface';
import { ApplyVolunteerDto } from '../dto/apply-volunteer.dto';
import { VolunteerProfileEntity } from '../../domain/entities/volunteer-profile.entity';

@Injectable()
export class ApplyVolunteerUseCase {
  constructor(
    @Inject(VOLUNTEER_REPOSITORY)
    private readonly volunteerRepo: IVolunteerRepository,
  ) {}

  async execute(userId: string, dto: ApplyVolunteerDto): Promise<VolunteerProfileEntity> {
    const existing = await this.volunteerRepo.findByUserId(userId);
    if (existing) {
      throw new ConflictException('Bạn đã gửi hồ sơ đăng ký tình nguyện viên trước đó');
    }

    return this.volunteerRepo.create({
      userId,
      specialization: dto.specialization,
      bio: dto.bio,
      certificateUrl: dto.certificateUrl,
    });
  }
}
