import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { VOLUNTEER_REPOSITORY, IVolunteerRepository } from '../../domain/repositories/volunteer.repository.interface';
import { UpdateVolunteerProfileDto } from '../dto/update-volunteer-profile.dto';
import { VolunteerProfileEntity } from '../../domain/entities/volunteer-profile.entity';

export interface UpdateVolunteerProfileResult {
  profile: VolunteerProfileEntity;
  requiresReverification: boolean;
  message: string;
}

@Injectable()
export class UpdateVolunteerProfileUseCase {
  constructor(
    @Inject(VOLUNTEER_REPOSITORY)
    private readonly volunteerRepo: IVolunteerRepository,
  ) {}

  async execute(userId: string, dto: UpdateVolunteerProfileDto): Promise<UpdateVolunteerProfileResult> {
    const existing = await this.volunteerRepo.findByUserId(userId);
    if (!existing) {
      throw new NotFoundException('Không tìm thấy hồ sơ tình nguyện viên');
    }

    const newSpecialization = dto.specialization !== undefined ? dto.specialization.trim() : undefined;
    const newBio = dto.bio !== undefined ? dto.bio.trim() : undefined;
    const newCertificateUrl = dto.certificateUrl !== undefined ? dto.certificateUrl.trim() : undefined;

    // Kiểm tra xem chuyên môn hoặc chứng chỉ có bị thay đổi khác giá trị hiện tại không
    const hasSpecializationChanged =
      newSpecialization !== undefined && newSpecialization !== (existing.specialization ?? '');
    const hasCertificateChanged =
      newCertificateUrl !== undefined && newCertificateUrl !== (existing.certificateUrl ?? '');

    const requiresReverification = hasSpecializationChanged || hasCertificateChanged;

    const updatedProfile = await this.volunteerRepo.updateProfile(userId, {
      specialization: newSpecialization,
      bio: newBio,
      certificateUrl: newCertificateUrl,
      ...(requiresReverification && {
        isVerified: false,
        isOnline: false,
      }),
    });

    const message = requiresReverification
      ? 'Thông tin chuyên môn/chứng chỉ đã thay đổi. Hồ sơ đã được chuyển sang trạng thái Chờ duyệt lại bởi Quản trị viên.'
      : 'Cập nhật thông tin giới thiệu bản thân thành công.';

    return {
      profile: updatedProfile,
      requiresReverification,
      message,
    };
  }
}
