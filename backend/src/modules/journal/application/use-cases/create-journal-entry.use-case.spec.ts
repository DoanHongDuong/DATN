import { CreateJournalEntryUseCase } from './create-journal-entry.use-case';
import { IJournalRepository } from '../../domain/repositories/journal.repository.interface';
import { IAiSentimentService } from '../../domain/services/ai-sentiment.service.interface';
import { EncryptionService } from '../../infrastructure/ai/encryption.service';
import { GetJournalEntriesUseCase } from './get-journal-entries.use-case';

describe('Journal Use Cases with Encryption', () => {
  let createUseCase: CreateJournalEntryUseCase;
  let getUseCase: GetJournalEntriesUseCase;
  let repository: jest.Mocked<IJournalRepository>;
  let aiService: jest.Mocked<IAiSentimentService>;
  let encryptionService: EncryptionService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      countByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    aiService = {
      analyze: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret-encryption-key-32b!'),
    };
    encryptionService = new EncryptionService(mockConfigService as any);

    createUseCase = new CreateJournalEntryUseCase(repository, aiService, encryptionService);
    getUseCase = new GetJournalEntriesUseCase(repository, encryptionService);
  });

  it('CreateJournalEntryUseCase should analyze raw text with AI, encrypt content for DB, and return raw content in response', async () => {
    const rawContent = 'Hôm nay trời mưa, tôi cảm thấy buồn và cô đơn';
    aiService.analyze.mockResolvedValue({
      sentimentLabel: 'negative',
      sentimentScore: -0.6,
      suggestedResourceCategory: 'calm_audio',
    });

    repository.create.mockImplementation(async (data) => ({
      id: 'journal-123',
      userId: data.userId,
      content: data.content,
      moodEmoji: data.moodEmoji ?? null,
      sentimentLabel: data.sentimentLabel ?? null,
      sentimentScore: data.sentimentScore ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await createUseCase.execute('user-1', {
      content: rawContent,
      moodEmoji: '😢',
    });

    // 1. AI analyze was called with RAW UNENCRYPTED content
    expect(aiService.analyze).toHaveBeenCalledWith(rawContent);

    // 2. Repository create was called with ENCRYPTED content (starts with enc:v1:)
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        content: expect.stringMatching(/^enc:v1:/),
        sentimentLabel: 'negative',
        sentimentScore: -0.6,
      }),
    );

    // 3. Response returned to client has the decrypted readable content
    expect(result.content).toBe(rawContent);
    expect(result.suggestedResourceCategory).toBe('calm_audio');
  });

  it('GetJournalEntriesUseCase should decrypt encrypted content before returning', async () => {
    const rawContent = 'Nội dung bí mật của nhật ký';
    const encrypted = encryptionService.encrypt(rawContent);

    repository.findByUserId.mockResolvedValue([
      {
        id: 'entry-1',
        userId: 'user-1',
        content: encrypted,
        moodEmoji: '😊',
        sentimentLabel: 'positive',
        sentimentScore: 0.8,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    repository.countByUserId.mockResolvedValue(1);

    const result = await getUseCase.execute('user-1', 1, 10);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].content).toBe(rawContent);
  });
});
