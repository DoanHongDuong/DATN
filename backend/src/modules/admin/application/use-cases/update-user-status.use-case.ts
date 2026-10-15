import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ADMIN_REPOSITORY, IAdminRepository } from '../../domain/repositories/admin.repository.interface';
import { AdminUserEntity } from '../../domain/entities/admin.entity';

@Injectable()
export class UpdateUserStatusUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepo: IAdminRepository,
  ) {}

  async execute(
    actorId: string,
    targetUserId: string,
    status: 'ACTIVE' | 'SUSPENDED',
  ): Promise<AdminUserEntity> {
    if (actorId === targetUserId) {
      throw new BadRequestException('Quản trị viên không thể tự khoá hoặc thay đổi trạng thái của chính mình');
    }

    const user = await this.adminRepo.findUserById(targetUserId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Không thể khoá hoặc thay đổi trạng thái tài khoản Quản trị viên');
    }

    const action = status === 'SUSPENDED' ? 'SUSPEND_USER' : 'ACTIVATE_USER';
    const description = status === 'SUSPENDED' ? 'Khoá tài khoản người dùng' : 'Mở khoá tài khoản người dùng';

    return this.adminRepo.updateUserStatus(actorId, targetUserId, status, action, description);
  }
}
