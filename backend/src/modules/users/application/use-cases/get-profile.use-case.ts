import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  USER_PROFILE_REPOSITORY,
  IUserProfileRepository,
} from '../../domain/repositories/user-profile.repository.interface';
import { UserProfileEntity } from '../../domain/entities/user-profile.entity';

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly userProfileRepository: IUserProfileRepository,
  ) {}

  async execute(userId: string): Promise<UserProfileEntity> {
    const user = await this.userProfileRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin tài khoản');
    }
    return user;
  }
}
