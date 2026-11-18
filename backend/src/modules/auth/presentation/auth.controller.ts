import { Controller, Post, Body, Get, Req, UseGuards, Inject, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case';
import { LoginUserUseCase } from '../application/use-cases/login-user.use-case';
import { RequestPasswordResetUseCase } from '../application/use-cases/request-password-reset.use-case';
import { ResetPasswordUseCase } from '../application/use-cases/reset-password.use-case';
import { VerifyEmailUseCase } from '../application/use-cases/verify-email.use-case';
import { ResendVerificationEmailUseCase } from '../application/use-cases/resend-verification-email.use-case';
import { RegisterDto } from '../application/dto/register.dto';
import { LoginDto } from '../application/dto/login.dto';
import { ForgotPasswordDto } from '../application/dto/forgot-password.dto';
import { VerifyEmailDto } from '../application/dto/verify-email.dto';
import { ResetPasswordDto } from '../application/dto/reset-password.dto';
import { ChangePasswordDto } from '../application/dto/change-password.dto';
import { ChangePasswordUseCase } from '../application/use-cases/change-password.use-case';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { USER_REPOSITORY, IUserRepository } from '../domain/repositories/user.repository.interface';

interface AuthenticatedRequest extends Request {
  user: { userId: string; role: string };
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly resendVerificationEmailUseCase: ResendVerificationEmailUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) { }

  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.registerUserUseCase.execute(dto);
  }

  @ApiOperation({ summary: 'Đăng nhập vào hệ thống' })
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.loginUserUseCase.execute(dto);
  }

  @ApiOperation({ summary: 'Xác minh email sau khi đăng ký' })
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.verifyEmailUseCase.execute(dto);
  }

  @ApiOperation({ summary: 'Gửi lại email xác minh (Giới hạn 3 lần/giờ)' })
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('resend-verification')
  async resendVerification(
    @Req() req: Request,
    @Body() dto?: ForgotPasswordDto,
  ) {
    // 1. Kiểm tra nếu người dùng đã đăng nhập (Bearer Token)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = this.jwtService.decode(token) as { sub?: string };
        if (payload?.sub) {
          return this.resendVerificationEmailUseCase.execute({ userId: payload.sub });
        }
      } catch {
        // Tiếp tục kiểm tra email trong body
      }
    }

    // 2. Nếu không có token, yêu cầu email từ body
    if (dto?.email) {
      return this.resendVerificationEmailUseCase.execute({ email: dto.email });
    }

    throw new BadRequestException('Vui lòng cung cấp địa chỉ email hoặc đăng nhập để gửi lại email xác thực');
  }

  @ApiOperation({ summary: 'Yêu cầu khôi phục mật khẩu' })
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.requestPasswordResetUseCase.execute(dto);
  }

  @ApiOperation({ summary: 'Đặt lại mật khẩu bằng token' })
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.resetPasswordUseCase.execute(dto);
  }

  @ApiOperation({ summary: 'Đổi mật khẩu tài khoản' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @Post('change-password')
  changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.changePasswordUseCase.execute(req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Lấy thông tin tài khoản hiện tại' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: AuthenticatedRequest) {
    const user = await this.userRepository.findById(req.user.userId);
    return {
      userId: req.user.userId,
      role: req.user.role,
      email: user?.email || '',
      fullName: user?.fullName || '',
      emailVerified: user?.emailVerified ?? false,
    };
  }
}
