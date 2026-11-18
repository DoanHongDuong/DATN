import { Injectable, Inject, Logger } from '@nestjs/common';
import { USER_REPOSITORY, IUserRepository } from '../../domain/repositories/user.repository.interface';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { MAIL_SERVICE, IMailService } from '../../../../infrastructure/mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class RequestPasswordResetUseCase {
  private readonly logger = new Logger(RequestPasswordResetUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(MAIL_SERVICE)
    private readonly mailService: IMailService,
  ) { }

  async execute(dto: ForgotPasswordDto) {
    const user = await this.userRepository.findByEmail(dto.email.trim());
    if (user) {
      // Chỉ gửi email đặt lại mật khẩu cho tài khoản đã xác thực email
      if (!user.emailVerified) {
        this.logger.warn(`Yêu cầu đặt lại mật khẩu bị từ chối cho ${user.email} vì tài khoản chưa xác thực email`);
        return {
          message: 'Nếu email tồn tại và đã được xác thực, hướng dẫn đặt lại mật khẩu đã được gửi đến hòm thư của bạn.',
        };
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = await bcrypt.hash(resetToken, 10);

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      await this.userRepository.update(user.id, {
        resetTokenHash,
        resetTokenExpiresAt: expiresAt,
      });

      // Gửi email ở nền
      this.mailService
        .sendPasswordResetEmail(user.email, user.fullName, resetToken)
        .catch((err: Error) => {
          this.logger.error(`Lỗi khi gửi email đặt lại mật khẩu đến ${user.email}: ${err?.message || err}`);
        });
    }

    // Luôn trả về cùng thông điệp trung lập nhằm chống rò rỉ sự tồn tại của email
    return {
      message: 'Nếu email tồn tại và đã được xác thực, hướng dẫn đặt lại mật khẩu đã được gửi đến hòm thư của bạn.',
    };
  }
}
