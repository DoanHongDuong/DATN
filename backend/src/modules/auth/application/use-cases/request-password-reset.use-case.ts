import { Injectable, Inject } from '@nestjs/common';
import { USER_REPOSITORY, IUserRepository } from '../../domain/repositories/user.repository.interface';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { MAIL_SERVICE, IMailService } from '../../../../infrastructure/mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(MAIL_SERVICE)
    private readonly mailService: IMailService,
  ) { }

  async execute(dto: ForgotPasswordDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = await bcrypt.hash(resetToken, 10);

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      await this.userRepository.update(user.id, {
        resetTokenHash,
        resetTokenExpiresAt: expiresAt,
      });

      // Send real reset email
      this.mailService.sendPasswordResetEmail(user.email, user.fullName, resetToken).catch(() => {
        // Silently handle — user still sees generic message per UC-02
      });
    }

    // Always return the same message regardless of whether user exists (UC-02 security)
    return { message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi' };
  }
}
