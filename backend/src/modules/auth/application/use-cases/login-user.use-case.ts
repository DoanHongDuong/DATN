import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { USER_REPOSITORY, IUserRepository } from '../../domain/repositories/user.repository.interface';
import { LoginDto } from '../dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AccountStatus } from '@prisma/client';

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: LoginDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    if (user.status === AccountStatus.SUSPENDED) {
      throw new UnauthorizedException('Tài khoản đã bị tạm khoá');
    }

    const payload = { sub: user.id, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: '7d' });

    return { accessToken };
  }
}
