import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../auth/infrastructure/auth.module';
import { VolunteerController } from '../presentation/volunteer.controller';
import { VolunteerPrismaRepository } from './persistence/volunteer.prisma.repository';
import { VOLUNTEER_REPOSITORY } from '../domain/repositories/volunteer.repository.interface';
import { ApplyVolunteerUseCase } from '../application/use-cases/apply-volunteer.use-case';
import { GetMyVolunteerProfileUseCase } from '../application/use-cases/get-my-volunteer-profile.use-case';
import { UpdateVolunteerOnlineUseCase } from '../application/use-cases/update-volunteer-online.use-case';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [VolunteerController],
  providers: [
    {
      provide: VOLUNTEER_REPOSITORY,
      useClass: VolunteerPrismaRepository,
    },
    ApplyVolunteerUseCase,
    GetMyVolunteerProfileUseCase,
    UpdateVolunteerOnlineUseCase,
  ],
  exports: [GetMyVolunteerProfileUseCase],
})
export class VolunteerModule {}
