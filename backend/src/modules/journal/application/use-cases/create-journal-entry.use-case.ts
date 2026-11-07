import { Inject, Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  JOURNAL_REPOSITORY,
  IJournalRepository,
} from '../../domain/repositories/journal.repository.interface';
import { IAiSentimentService } from '../../domain/services/ai-sentiment.service.interface';
import { EncryptionService } from '../../infrastructure/ai/encryption.service';
import { CreateJournalEntryDto } from '../dto/create-journal-entry.dto';
import { CreateNotificationUseCase } from '../../../notification/application/use-cases/create-notification.use-case';

export const AI_SENTIMENT_SERVICE = 'IAiSentimentService';

@Injectable()
export class CreateJournalEntryUseCase {
  constructor(
    @Inject(JOURNAL_REPOSITORY)
    private readonly journalRepository: IJournalRepository,
    @Inject(AI_SENTIMENT_SERVICE)
    private readonly aiSentimentService: IAiSentimentService,
    private readonly encryptionService: EncryptionService,
    private readonly configService: ConfigService,
    @Optional()
    private readonly createNotificationUseCase?: CreateNotificationUseCase,
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
    const response: {
      id: string;
      userId: string;
      content: string;
      moodEmoji: string | null;
      sentimentLabel: string | null;
      sentimentScore: number | null;
      createdAt: Date;
      updatedAt: Date;
      suggestedResourceCategory?: string | null;
      emergencyHotline?: string | null;
    } = {
      ...entry,
      content: dto.content,
      suggestedResourceCategory: sentiment.suggestedResourceCategory,
    };

    if (sentiment.sentimentLabel === 'crisis') {
      response.emergencyHotline =
        this.configService.get<string>('EMERGENCY_HOTLINE') ?? null;

      if (this.createNotificationUseCase) {
        await this.createNotificationUseCase.execute({
          userId,
          title: 'Cảnh báo sức khỏe cảm xúc',
          content: 'Hệ thống nhận thấy bạn đang trải qua cảm xúc căng thẳng hoặc khủng hoảng. Đừng ngần ngại liên hệ hotline khẩn cấp hoặc yêu cầu hỗ trợ từ tình nguyện viên.',
          type: 'CRISIS_ALERT',
        }).catch(() => null);
      }
    }

    return response;
  }
}
