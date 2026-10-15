import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { USER_REPOSITORY, IUserRepository } from '../../domain/repositories/user.repository.interface';
import { MAIL_SERVICE, IMailService } from '../../../../infrastructure/mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class ResendVerificationEmailUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(MAIL_SERVICE)
    private readonly mailService: IMailService,
  ) {}

  async execute(email: string) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      // Generic message to prevent user enumeration
      return { message: 'Nếu email tồn tại, link xác minh đã được gửi lại' };
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email đã được xác minh. Vui lòng đăng nhập');
    }

    const verifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyTokenHash = await bcrypt.hash(verifyToken, 10);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.userRepository.update(user.id, {
      emailVerifyTokenHash,
      emailVerifyTokenExpiresAt: expiresAt,
    });

    this.mailService.sendVerificationEmail(user.email, user.fullName, verifyToken).catch(() => {
      // Silently handle
    });

    return { message: 'Nếu email tồn tại, link xác minh đã được gửi lại' };
  }
}
