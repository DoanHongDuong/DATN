import { GetMoodTrendUseCase } from './get-mood-trend.use-case';
import { IJournalRepository } from '../../domain/repositories/journal.repository.interface';

describe('GetMoodTrendUseCase', () => {
  let useCase: GetMoodTrendUseCase;
  let repository: jest.Mocked<IJournalRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByUserIdSince: jest.fn(),
      countByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findRelaxationResourcesByCategory: jest.fn(),
      findAllRelaxationResources: jest.fn(),
    };

    useCase = new GetMoodTrendUseCase(repository);
  });

  it('should return empty points and insufficient_data when user has no entries', async () => {
    repository.findByUserIdSince.mockResolvedValue([]);

    const result = await useCase.execute('user-1', 14);

    expect(result.points).toHaveLength(0);
    expect(result.summary.totalEntries).toBe(0);
    expect(result.summary.trend).toBe('insufficient_data');
    expect(repository.findByUserIdSince).toHaveBeenCalledWith(
      'user-1',
      expect.any(Date),
    );
  });

  it('should calculate daily points and detect improving trend', async () => {
    const mockEntries = [
      {
        id: '1',
        userId: 'user-1',
        content: 'encrypted',
        moodEmoji: '😔',
        sentimentLabel: 'negative',
        sentimentScore: -0.6,
        createdAt: new Date('2026-10-20T10:00:00Z'),
        updatedAt: new Date('2026-10-20T10:00:00Z'),
      },
      {
        id: '2',
        userId: 'user-1',
        content: 'encrypted',
        moodEmoji: '😊',
        sentimentLabel: 'positive',
        sentimentScore: 0.8,
        createdAt: new Date('2026-10-25T10:00:00Z'),
        updatedAt: new Date('2026-10-25T10:00:00Z'),
      },
    ];

    repository.findByUserIdSince.mockResolvedValue(mockEntries as any);

    const result = await useCase.execute('user-1', 14);

    expect(result.points).toHaveLength(2);
    expect(result.summary.totalEntries).toBe(2);
    expect(result.summary.negativeCount).toBe(1);
    expect(result.summary.positiveCount).toBe(1);
    expect(result.summary.trend).toBe('improving');
    expect(result.points[0].dominantSentiment).toBe('negative');
    expect(result.points[1].dominantSentiment).toBe('positive');
  });

  it('should detect declining trend when scores get worse', async () => {
    const mockEntries = [
      {
        id: '1',
        userId: 'user-1',
        content: 'encrypted',
        moodEmoji: '😊',
        sentimentLabel: 'positive',
        sentimentScore: 0.8,
        createdAt: new Date('2026-10-20T10:00:00Z'),
        updatedAt: new Date('2026-10-20T10:00:00Z'),
      },
      {
        id: '2',
        userId: 'user-1',
        content: 'encrypted',
        moodEmoji: '😭',
        sentimentLabel: 'crisis',
        sentimentScore: -1.0,
        createdAt: new Date('2026-10-25T10:00:00Z'),
        updatedAt: new Date('2026-10-25T10:00:00Z'),
      },
    ];

    repository.findByUserIdSince.mockResolvedValue(mockEntries as any);

    const result = await useCase.execute('user-1', 14);

    expect(result.summary.trend).toBe('declining');
    expect(result.summary.crisisCount).toBe(1);
    expect(result.summary.positiveCount).toBe(1);
  });
});

