import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { USER_REPOSITORY, IUserRepository } from '../../domain/repositories/user.repository.interface';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(dto: VerifyEmailDto) {
    const user = await this.userRepository.findByEmail(dto.email.trim());

    if (!user) {
      throw new BadRequestException('Token xác minh không hợp lệ hoặc đã hết hạn');
    }

    if (user.emailVerified) {
      return {
        message: 'Email đã được xác minh trước đó',
        alreadyVerified: true,
      };
    }

    if (!user.emailVerifyTokenHash || !user.emailVerifyTokenExpiresAt) {
      throw new BadRequestException('Token xác minh không hợp lệ hoặc đã hết hạn');
    }

    if (user.emailVerifyTokenExpiresAt < new Date()) {
      throw new BadRequestException('Token xác minh đã hết hạn. Vui lòng yêu cầu gửi lại email mới');
    }

    // So sánh token an toàn (timing-safe comparison):
    // Hỗ trợ SHA-256 (chuẩn mới) và bcrypt (tương thích ngược nếu có token cũ)
    let isTokenValid = false;
    if (user.emailVerifyTokenHash.startsWith('$2b$') || user.emailVerifyTokenHash.startsWith('$2a$')) {
      isTokenValid = await bcrypt.compare(dto.token.trim(), user.emailVerifyTokenHash);
    } else {
      const incomingHash = crypto.createHash('sha256').update(dto.token.trim()).digest('hex');
      const incomingBuf = Buffer.from(incomingHash, 'hex');
      const storedBuf = Buffer.from(user.emailVerifyTokenHash, 'hex');
      isTokenValid =
        incomingBuf.length === storedBuf.length &&
        crypto.timingSafeEqual(incomingBuf, storedBuf);
    }

    if (!isTokenValid) {
      throw new BadRequestException('Token xác minh không hợp lệ hoặc đã hết hạn');
    }

    // Token dùng một lần: vô hiệu hóa token và cập nhật trạng thái đã xác thực
    await this.userRepository.update(user.id, {
      emailVerified: true,
      emailVerifyTokenHash: null,
      emailVerifyTokenExpiresAt: null,
    });

    return {
      message: 'Email của bạn đã được xác minh thành công. Cảm ơn bạn!',
      success: true,
    };
  }
}
