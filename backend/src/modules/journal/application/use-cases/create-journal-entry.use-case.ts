import { Inject, Injectable } from '@nestjs/common';
import {
  JOURNAL_REPOSITORY,
  IJournalRepository,
} from '../../domain/repositories/journal.repository.interface';
import { IAiSentimentService } from '../../domain/services/ai-sentiment.service.interface';
import { EncryptionService } from '../../infrastructure/ai/encryption.service';
import { CreateJournalEntryDto } from '../dto/create-journal-entry.dto';

export const AI_SENTIMENT_SERVICE = 'IAiSentimentService';

@Injectable()
export class CreateJournalEntryUseCase {
  constructor(
    @Inject(JOURNAL_REPOSITORY)
    private readonly journalRepository: IJournalRepository,
    @Inject(AI_SENTIMENT_SERVICE)
    private readonly aiSentimentService: IAiSentimentService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async execute(userId: string, dto: CreateJournalEntryDto) {
    // 1. Phân tích cảm xúc bằng AI với content GỐC (chưa mã hoá)
    const sentiment = await this.aiSentimentService.analyze(dto.content);

    // 2. Mã hoá content trước khi lưu vào DB
    const encryptedContent = this.encryptionService.encrypt(dto.content);

    // 3. Lưu vào DB với content đã mã hoá
    const entry = await this.journalRepository.create({
      userId,
      content: encryptedContent,
      moodEmoji: dto.moodEmoji,
      sentimentLabel: sentiment.sentimentLabel,
      sentimentScore: sentiment.sentimentScore,
    });

    // 4. Trả về response cho client với content gốc đã giải mã
    return {
      ...entry,
      content: dto.content,
      suggestedResourceCategory: sentiment.suggestedResourceCategory,
    };
  }
}
