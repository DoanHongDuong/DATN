import { Controller, Post, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { ApplyVolunteerUseCase } from '../application/use-cases/apply-volunteer.use-case';
import { GetMyVolunteerProfileUseCase } from '../application/use-cases/get-my-volunteer-profile.use-case';
import { UpdateVolunteerOnlineUseCase } from '../application/use-cases/update-volunteer-online.use-case';
import { ApplyVolunteerDto } from '../application/dto/apply-volunteer.dto';
import { UpdateOnlineStatusDto } from '../application/dto/update-online-status.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    role: string;
  };
}

@ApiTags('Volunteers')
@ApiBearerAuth()
@Controller('volunteers')
export class VolunteerController {
  constructor(
    private readonly applyVolunteerUseCase: ApplyVolunteerUseCase,
    private readonly getMyVolunteerProfileUseCase: GetMyVolunteerProfileUseCase,
    private readonly updateVolunteerOnlineUseCase: UpdateVolunteerOnlineUseCase,
  ) {}

  @ApiOperation({ summary: 'Nộp hồ sơ đăng ký làm tình nguyện viên' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Post('apply')
  async apply(@Req() req: AuthenticatedRequest, @Body() dto: ApplyVolunteerDto) {
    return this.applyVolunteerUseCase.execute(req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Lấy hồ sơ tình nguyện viên của chính mình' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@Req() req: AuthenticatedRequest) {
    return this.getMyVolunteerProfileUseCase.execute(req.user.userId);
  }

  @ApiOperation({ summary: 'Cập nhật trạng thái trực tuyến của tình nguyện viên' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VOLUNTEER)
  @Patch('me/online')
  async updateOnline(@Req() req: AuthenticatedRequest, @Body() dto: UpdateOnlineStatusDto) {
    return this.updateVolunteerOnlineUseCase.execute(req.user.userId, dto.isOnline);
  }
}
