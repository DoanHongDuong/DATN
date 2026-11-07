import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ChatController } from '../presentation/chat.controller';
import { SupportController } from '../presentation/support.controller';
import { ChatGateway } from '../presentation/chat.gateway';

import { RequestSupportUseCase } from '../application/use-cases/request-support.use-case';
import { AcceptSessionUseCase } from '../application/use-cases/accept-session.use-case';
import { SendMessageUseCase } from '../application/use-cases/send-message.use-case';
import { EndSessionUseCase } from '../application/use-cases/end-session.use-case';
import { GetQueuePositionUseCase } from '../application/use-cases/get-queue-position.use-case';
import { GetMyActiveSessionUseCase } from '../application/use-cases/get-my-active-session.use-case';
import { CancelSessionUseCase } from '../application/use-cases/cancel-session.use-case';
import { SubmitSessionFeedbackUseCase } from '../application/use-cases/submit-session-feedback.use-case';
import { GetSessionFeedbackUseCase } from '../application/use-cases/get-session-feedback.use-case';

import { ChatPrismaRepository } from './persistence/chat.prisma.repository';
import { CHAT_REPOSITORY } from '../domain/repositories/chat.repository.interface';
import { AuthModule } from '../../auth/infrastructure/auth.module';
import { NotificationModule } from '../../notification/infrastructure/notification.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule, // Cần JwtModule export từ AuthModule
    NotificationModule,
  ],
  controllers: [ChatController, SupportController],
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
    GetMyActiveSessionUseCase,
    CancelSessionUseCase,
    SubmitSessionFeedbackUseCase,
    GetSessionFeedbackUseCase,
    ChatGateway,
  ],
  exports: [ChatGateway],
})
export class ChatModule {}
