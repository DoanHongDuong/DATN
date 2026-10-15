import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/presentation/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import { GetPendingVolunteersUseCase } from '../application/use-cases/get-pending-volunteers.use-case';
import { ApproveVolunteerUseCase } from '../application/use-cases/approve-volunteer.use-case';
import { RejectVolunteerUseCase } from '../application/use-cases/reject-volunteer.use-case';
import { GetUsersUseCase } from '../application/use-cases/get-users.use-case';
import { UpdateUserStatusUseCase } from '../application/use-cases/update-user-status.use-case';
import { UpdateUserStatusDto } from '../application/dto/update-user-status.dto';
import { GetUsersQueryDto } from '../application/dto/get-users-query.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    role: string;
  };
}

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly getPendingVolunteersUseCase: GetPendingVolunteersUseCase,
    private readonly approveVolunteerUseCase: ApproveVolunteerUseCase,
    private readonly rejectVolunteerUseCase: RejectVolunteerUseCase,
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly updateUserStatusUseCase: UpdateUserStatusUseCase,
  ) {}

  @ApiOperation({ summary: 'Lấy danh sách hồ sơ tình nguyện viên đang chờ duyệt' })
  @Get('volunteers/pending')
  async getPendingVolunteers() {
    return this.getPendingVolunteersUseCase.execute();
  }

  @ApiOperation({ summary: 'Phê duyệt hồ sơ tình nguyện viên' })
  @Post('volunteers/:profileId/approve')
  async approveVolunteer(
    @Req() req: AuthenticatedRequest,
    @Param('profileId') profileId: string,
  ) {
    return this.approveVolunteerUseCase.execute(req.user.userId, profileId);
  }

  @ApiOperation({ summary: 'Từ chối và xoá hồ sơ tình nguyện viên' })
  @Post('volunteers/:profileId/reject')
  async rejectVolunteer(
    @Req() req: AuthenticatedRequest,
    @Param('profileId') profileId: string,
  ) {
    return this.rejectVolunteerUseCase.execute(req.user.userId, profileId);
  }

  @ApiOperation({ summary: 'Lấy danh sách người dùng có phân trang và tìm kiếm' })
  @Get('users')
  async getUsers(@Query() query: GetUsersQueryDto) {
    return this.getUsersUseCase.execute(query);
  }

  @ApiOperation({ summary: 'Cập nhật trạng thái người dùng (ACTIVE / SUSPENDED)' })
  @Patch('users/:id/status')
  async updateUserStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.updateUserStatusUseCase.execute(req.user.userId, id, dto.status);
  }
}
