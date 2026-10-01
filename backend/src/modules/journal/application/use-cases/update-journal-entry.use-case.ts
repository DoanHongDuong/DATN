import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  JOURNAL_REPOSITORY,
  IJournalRepository,
} from '../../domain/repositories/journal.repository.interface';
import { IAiSentimentService } from '../../domain/services/ai-sentiment.service.interface';
import { EncryptionService } from '../../infrastructure/ai/encryption.service';
import { UpdateJournalEntryDto } from '../dto/update-journal-entry.dto';
import { AI_SENTIMENT_SERVICE } from './create-journal-entry.use-case';

@Injectable()
export class UpdateJournalEntryUseCase {
  constructor(
    @Inject(JOURNAL_REPOSITORY)
    private readonly journalRepository: IJournalRepository,
    @Inject(AI_SENTIMENT_SERVICE)
    private readonly aiSentimentService: IAiSentimentService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async execute(userId: string, entryId: string, dto: UpdateJournalEntryDto) {
    const existing = await this.journalRepository.findById(entryId);
    if (!existing) {
      throw new NotFoundException('Journal entry not found');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException('You can only update your own journal entries');
    }

    let sentimentLabel = existing.sentimentLabel;
    let sentimentScore = existing.sentimentScore;
    let suggestedResourceCategory: string | null = null;

    // Decrypt existing content to compare if content actually changed
    const existingContentDecrypted = this.encryptionService.decrypt(existing.content);

    // Re-run sentiment analysis if content changed
    if (dto.content && dto.content !== existingContentDecrypted) {
      const sentiment = await this.aiSentimentService.analyze(dto.content);
      sentimentLabel = sentiment.sentimentLabel;
      sentimentScore = sentiment.sentimentScore;
      suggestedResourceCategory = sentiment.suggestedResourceCategory;
    }

    const contentToSave = dto.content ? this.encryptionService.encrypt(dto.content) : undefined;

    const updated = await this.journalRepository.update(entryId, {
      content: contentToSave,
      moodEmoji: dto.moodEmoji,
      sentimentLabel,
      sentimentScore,
    });

    return {
      ...updated,
      content: dto.content ?? existingContentDecrypted,
      suggestedResourceCategory,
    };
  }
}
