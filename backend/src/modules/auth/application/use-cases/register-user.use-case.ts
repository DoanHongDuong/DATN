import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { USER_REPOSITORY, IUserRepository } from '../../domain/repositories/user.repository.interface';
import { RegisterDto } from '../dto/register.dto';
import * as bcrypt from 'bcrypt';
import { Role, AccountStatus } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Mật khẩu xác nhận không khớp');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    try {
      const user = await this.userRepository.create({
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        role: Role.USER,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
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

