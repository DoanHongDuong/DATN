import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { USER_REPOSITORY, IUserRepository } from '../../domain/repositories/user.repository.interface';
import { MAIL_SERVICE, IMailService } from '../../../../infrastructure/mail/mail.service';
import * as crypto from 'crypto';

@Injectable()
export class ResendVerificationEmailUseCase {
  private readonly logger = new Logger(ResendVerificationEmailUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(MAIL_SERVICE)
    private readonly mailService: IMailService,
  ) {}

  async execute(identifier: { userId?: string; email?: string } | string) {
    let user = null;

    if (typeof identifier === 'string') {
      const trimmed = identifier.trim();
      user = await this.userRepository.findByEmail(trimmed);
    } else if (identifier.userId) {
      user = await this.userRepository.findById(identifier.userId);
    } else if (identifier.email) {
      user = await this.userRepository.findByEmail(identifier.email.trim());
    }

    if (!user) {
      // Phản hồi trung lập để ngăn chặn việc dò quét sự tồn tại của email
      return { message: 'Nếu email tồn tại, link xác nhận đã được gửi lại' };
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email của bạn đã được xác minh trước đó');
    }

    // Sinh token mới 32 bytes ngẫu nhiên và băm SHA-256
    const rawVerifyToken = crypto.randomBytes(32).toString('hex');
    const emailVerifyTokenHash = crypto.createHash('sha256').update(rawVerifyToken).digest('hex');

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 giờ

    await this.userRepository.update(user.id, {
      emailVerifyTokenHash,
      emailVerifyTokenExpiresAt: expiresAt,
    });

    // Gửi email ở nền
    this.mailService
      .sendVerificationEmail(user.email, user.fullName, rawVerifyToken)
      .catch((err: unknown) => {
        this.logger.warn(`Không thể gửi lại email xác thực tới ${user.email}: ${err instanceof Error ? err.message : String(err)}`);
      });

    return { message: 'Nếu email tồn tại, link xác nhận đã được gửi lại' };
  }
}
