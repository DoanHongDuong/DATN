import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { USER_REPOSITORY, IUserRepository } from '../../domain/repositories/user.repository.interface';
import { MAIL_SERVICE, IMailService } from '../../../../infrastructure/mail/mail.service';
import { RegisterDto } from '../dto/register.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Role, AccountStatus } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class RegisterUserUseCase {
  private readonly logger = new Logger(RegisterUserUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    @Inject(MAIL_SERVICE)
    private readonly mailService: IMailService,
  ) {}

  async execute(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Mật khẩu xác nhận không khớp');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    // Sinh token xác thực email ngẫu nhiên an toàn bằng crypto
    const rawVerifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenHash = crypto.createHash('sha256').update(rawVerifyToken).digest('hex');
    const verifyTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 giờ

    try {
      const user = await this.userRepository.create({
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        role: Role.USER,
        status: AccountStatus.ACTIVE,
        emailVerified: false,
        emailVerifyTokenHash: verifyTokenHash,
        emailVerifyTokenExpiresAt: verifyTokenExpiresAt,
      });

      // Gửi email xác thực ở nền (non-blocking) — không làm chậm hoặc hỏng luồng đăng ký
      this.mailService
        .sendVerificationEmail(user.email, user.fullName, rawVerifyToken)
        .catch((err: unknown) => {
          this.logger.warn(`Không thể gửi email xác thực đến ${user.email}: ${err instanceof Error ? err.message : String(err)}`);
        });

      const payload = { sub: user.id, role: user.role };
      const accessToken = await this.jwtService.signAsync(payload, { expiresIn: '7d' });

      return {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        message: 'Đăng ký tài khoản thành công',
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException('Email đã được sử dụng');
      }
      throw error;
    }
  }
}

