import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/infrastructure/auth.module';
import { UsersController } from '../presentation/users.controller';
import { USER_PROFILE_REPOSITORY } from '../domain/repositories/user-profile.repository.interface';
import { UserProfilePrismaRepository } from './persistence/user-profile.prisma.repository';
import { GetProfileUseCase } from '../application/use-cases/get-profile.use-case';
import { UpdateProfileUseCase } from '../application/use-cases/update-profile.use-case';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [
    {
      provide: USER_PROFILE_REPOSITORY,
      useClass: UserProfilePrismaRepository,
    },
    GetProfileUseCase,
    UpdateProfileUseCase,
  ],
  exports: [GetProfileUseCase, UpdateProfileUseCase],
})
export class UsersModule {}
