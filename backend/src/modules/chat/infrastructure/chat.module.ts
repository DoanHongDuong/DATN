import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ChatController } from '../presentation/chat.controller';
import { ChatGateway } from '../presentation/chat.gateway';

import { RequestSupportUseCase } from '../application/use-cases/request-support.use-case';
import { AcceptSessionUseCase } from '../application/use-cases/accept-session.use-case';
import { SendMessageUseCase } from '../application/use-cases/send-message.use-case';
import { EndSessionUseCase } from '../application/use-cases/end-session.use-case';
import { GetQueuePositionUseCase } from '../application/use-cases/get-queue-position.use-case';

import { ChatPrismaRepository } from './persistence/chat.prisma.repository';
import { CHAT_REPOSITORY } from '../domain/repositories/chat.repository.interface';
import { AuthModule } from '../../auth/infrastructure/auth.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule, // Cần JwtModule export từ AuthModule
  ],
  controllers: [ChatController],
  providers: [
    {
      provide: CHAT_REPOSITORY,
      useClass: ChatPrismaRepository,
    },
    RequestSupportUseCase,
    AcceptSessionUseCase,
    SendMessageUseCase,
    EndSessionUseCase,
    GetQueuePositionUseCase,
    ChatGateway,
  ],
  exports: [ChatGateway],
})
export class ChatModule {}
