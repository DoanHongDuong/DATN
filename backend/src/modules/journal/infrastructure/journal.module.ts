import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../auth/infrastructure/auth.module';
import { JournalController } from '../presentation/journal.controller';
import { JournalPrismaRepository } from './persistence/journal.prisma.repository';
import { AiSentimentService } from './ai/ai-sentiment.service';
import { JOURNAL_REPOSITORY } from '../domain/repositories/journal.repository.interface';
import { AI_SENTIMENT_SERVICE } from '../application/use-cases/create-journal-entry.use-case';
import { CreateJournalEntryUseCase } from '../application/use-cases/create-journal-entry.use-case';
import { GetJournalEntriesUseCase } from '../application/use-cases/get-journal-entries.use-case';
import { UpdateJournalEntryUseCase } from '../application/use-cases/update-journal-entry.use-case';
import { DeleteJournalEntryUseCase } from '../application/use-cases/delete-journal-entry.use-case';
import { SuggestResourcesUseCase } from '../application/use-cases/suggest-resources.use-case';

import { EncryptionService } from './ai/encryption.service';
import { ENCRYPTION_SERVICE } from '../domain/services/encryption.service.interface';

@Module({
  imports: [
    AuthModule,   // exports JwtModule → provides JwtService for JwtAuthGuard
    ConfigModule, // provides ConfigService for AiSentimentService & EncryptionService
  ],
  controllers: [JournalController],
  providers: [
    EncryptionService,
    {
      provide: ENCRYPTION_SERVICE,
      useExisting: EncryptionService,
    },
    {
      provide: JOURNAL_REPOSITORY,
      useClass: JournalPrismaRepository,
    },
    {
      provide: AI_SENTIMENT_SERVICE,
      useClass: AiSentimentService,
    },
    CreateJournalEntryUseCase,
    GetJournalEntriesUseCase,
    UpdateJournalEntryUseCase,
    DeleteJournalEntryUseCase,
    SuggestResourcesUseCase,
  ],
  exports: [EncryptionService],
})
export class JournalModule {}
