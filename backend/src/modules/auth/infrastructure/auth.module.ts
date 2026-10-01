import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthController } from '../presentation/auth.controller';
import { RegisterUserUseCase } from '../application/use-cases/register-user.use-case';
import { LoginUserUseCase } from '../application/use-cases/login-user.use-case';
import { RequestPasswordResetUseCase } from '../application/use-cases/request-password-reset.use-case';
import { UserPrismaRepository } from './persistence/user.prisma.repository';
import { USER_REPOSITORY } from '../domain/repositories/user.repository.interface';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRoot([{
      ttl: 900000,
      limit: 5,
    }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: UserPrismaRepository,
    },
    RegisterUserUseCase,
    LoginUserUseCase,
    RequestPasswordResetUseCase,
  ],
  exports: [JwtModule],
})
export class AuthModule {}
