import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  USER_PROFILE_REPOSITORY,
  IUserProfileRepository,
} from '../../domain/repositories/user-profile.repository.interface';
import { UserProfileEntity } from '../../domain/entities/user-profile.entity';
import { UpdateProfileDto } from '../dto/update-profile.dto';

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly userProfileRepository: IUserProfileRepository,
  ) {}

  async execute(userId: string, dto: UpdateProfileDto): Promise<UserProfileEntity> {
    const user = await this.userProfileRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin tài khoản');
    }

    const updated = await this.userProfileRepository.update(userId, {
      ...(dto.fullName !== undefined ? { fullName: dto.fullName.trim() } : {}),
      ...(dto.phone !== undefined ? { phone: dto.phone.trim() || null } : {}),
    });

    return updated;
  }
}
