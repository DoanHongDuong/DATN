import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../auth/infrastructure/auth.module';
import { NotificationModule } from '../../notification/infrastructure/notification.module';
import { AdminController } from '../presentation/admin.controller';
import { AdminPrismaRepository } from './persistence/admin.prisma.repository';
import { ADMIN_REPOSITORY } from '../domain/repositories/admin.repository.interface';
import { GetPendingVolunteersUseCase } from '../application/use-cases/get-pending-volunteers.use-case';
import { ApproveVolunteerUseCase } from '../application/use-cases/approve-volunteer.use-case';
import { RejectVolunteerUseCase } from '../application/use-cases/reject-volunteer.use-case';
import { GetUsersUseCase } from '../application/use-cases/get-users.use-case';
import { UpdateUserStatusUseCase } from '../application/use-cases/update-user-status.use-case';
import { GetAdminResourcesUseCase } from '../application/use-cases/get-admin-resources.use-case';
import { CreateResourceUseCase } from '../application/use-cases/create-resource.use-case';
import { UpdateResourceUseCase } from '../application/use-cases/update-resource.use-case';
import { DeleteResourceUseCase } from '../application/use-cases/delete-resource.use-case';
import { GetAuditLogsUseCase } from '../application/use-cases/get-audit-logs.use-case';
import { GetSystemStatsUseCase } from '../application/use-cases/get-system-stats.use-case';

@Module({
  imports: [ConfigModule, AuthModule, NotificationModule],
  controllers: [AdminController],
  providers: [
    {
      provide: ADMIN_REPOSITORY,
      useClass: AdminPrismaRepository,
    },
    GetPendingVolunteersUseCase,
    ApproveVolunteerUseCase,
    RejectVolunteerUseCase,
    GetUsersUseCase,
    UpdateUserStatusUseCase,
    GetAdminResourcesUseCase,
    CreateResourceUseCase,
    UpdateResourceUseCase,
    DeleteResourceUseCase,
    GetAuditLogsUseCase,
    GetSystemStatsUseCase,
  ],
})
export class AdminModule {}
