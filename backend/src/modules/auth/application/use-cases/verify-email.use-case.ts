import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { USER_REPOSITORY, IUserRepository } from '../../domain/repositories/user.repository.interface';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: VerifyEmailDto) {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new BadRequestException('Token xác minh không hợp lệ hoặc đã hết hạn');
    }

    if (user.emailVerified) {
      return { message: 'Email đã được xác minh trước đó' };
    }

    if (!user.emailVerifyTokenHash || !user.emailVerifyTokenExpiresAt) {
      throw new BadRequestException('Token xác minh không hợp lệ hoặc đã hết hạn');
    }

    if (user.emailVerifyTokenExpiresAt < new Date()) {
      throw new BadRequestException('Token xác minh đã hết hạn. Vui lòng đăng ký lại');
    }

    const isTokenValid = await bcrypt.compare(dto.token, user.emailVerifyTokenHash);
    if (!isTokenValid) {
      throw new BadRequestException('Token xác minh không hợp lệ hoặc đã hết hạn');
    }

    await this.userRepository.update(user.id, {
      emailVerified: true,
      emailVerifyTokenHash: null,
      emailVerifyTokenExpiresAt: null,
    });

    return { message: 'Email đã được xác minh thành công. Bạn có thể đăng nhập ngay bây giờ' };
  }
}
