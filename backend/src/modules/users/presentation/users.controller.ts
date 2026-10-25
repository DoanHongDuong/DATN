import { Controller, Get, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { GetProfileUseCase } from '../application/use-cases/get-profile.use-case';
import { UpdateProfileUseCase } from '../application/use-cases/update-profile.use-case';
import { UpdateProfileDto } from '../application/dto/update-profile.dto';

interface AuthenticatedRequest extends Request {
  user: { userId: string; role: string };
}

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
  ) {}

  @ApiOperation({ summary: 'Lấy thông tin tài khoản cá nhân hiện tại' })
  @Get('me')
  async getMe(@Req() req: AuthenticatedRequest) {
    return this.getProfileUseCase.execute(req.user.userId);
  }

  @ApiOperation({ summary: 'Cập nhật thông tin tài khoản cá nhân (fullName, phone)' })
  @Patch('me')
  async updateMe(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.updateProfileUseCase.execute(req.user.userId, dto);
  }
}
