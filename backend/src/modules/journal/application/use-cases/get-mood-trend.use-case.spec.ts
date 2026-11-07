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

  it('trạng thái rỗng: trả về points rỗng và insufficient_data khi không có bài nhật ký', async () => {
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

  it('quy tắc an toàn: khi có nhãn crisis thì ưu tiên trạng thái hỗ trợ cao nhất (crisis)', async () => {
    const now = new Date();
    const mockEntries = [
      {
        id: '1',
        userId: 'user-1',
        content: 'encrypted',
        moodEmoji: '😔',
        sentimentLabel: 'crisis',
        sentimentScore: -1.0,
        createdAt: new Date(now.getTime() - 10 * 86400000),
        updatedAt: new Date(now.getTime() - 10 * 86400000),
      },
      {
        id: '2',
        userId: 'user-1',
        content: 'encrypted',
        moodEmoji: '😊',
        sentimentLabel: 'positive',
        sentimentScore: 0.8,
        createdAt: new Date(now.getTime() - 5 * 86400000),
        updatedAt: new Date(now.getTime() - 5 * 86400000),
      },
      {
        id: '3',
        userId: 'user-1',
        content: 'encrypted',
        moodEmoji: '😊',
        sentimentLabel: 'positive',
        sentimentScore: 0.9,
        createdAt: new Date(now.getTime() - 1 * 86400000),
        updatedAt: new Date(now.getTime() - 1 * 86400000),
      },
    ];

    repository.findByUserIdSince.mockResolvedValue(mockEntries as any);

    const result = await useCase.execute('user-1', 14);

    expect(result.summary.crisisCount).toBe(1);
    expect(result.summary.trend).toBe('crisis');
  });

  it('quy tắc ngày dữ liệu: tổng số ngày có dữ liệu dưới 3 thì trả về insufficient_data', async () => {
    const now = new Date();
    const mockEntries = [
      {
        id: '1',
        userId: 'user-1',
        content: 'encrypted',
        moodEmoji: '😊',
        sentimentLabel: 'positive',
        sentimentScore: 0.7,
        createdAt: new Date(now.getTime() - 10 * 86400000),
        updatedAt: new Date(now.getTime() - 10 * 86400000),
      },
      {
        id: '2',
        userId: 'user-1',
        content: 'encrypted 2 cùng ngày',
        moodEmoji: '😊',
        sentimentLabel: 'positive',
        sentimentScore: 0.8,
        createdAt: new Date(now.getTime() - 10 * 86400000),
        updatedAt: new Date(now.getTime() - 10 * 86400000),
      },
      {
        id: '3',
        userId: 'user-1',
        content: 'encrypted ngày 2',
        moodEmoji: '😐',
        sentimentLabel: 'neutral',
        sentimentScore: 0.0,
        createdAt: new Date(now.getTime() - 2 * 86400000),
        updatedAt: new Date(now.getTime() - 2 * 86400000),
      },
    ];

    repository.findByUserIdSince.mockResolvedValue(mockEntries as any);

    const result = await useCase.execute('user-1', 14);

    // 3 bài nhưng chỉ có 2 ngày lịch có dữ liệu
    expect(result.summary.totalEntries).toBe(3);
    expect(result.points).toHaveLength(2);
    expect(result.summary.trend).toBe('insufficient_data');
  });

  it('quy tắc 2 nửa: nếu 1 trong 2 nửa không có dữ liệu để so sánh thì trả về insufficient_data', async () => {
    const now = new Date();
    // Cả 3 ngày đều nằm trong nửa đầu (từ 8 đến 12 ngày trước, trong khi nửa sau là từ 0 đến 7 ngày trước)
    const mockEntries = [
      {
        id: '1',
        userId: 'user-1',
        content: '1',
        moodEmoji: '😊',
        sentimentLabel: 'positive',
        sentimentScore: 0.7,
        createdAt: new Date(now.getTime() - 12 * 86400000),
        updatedAt: new Date(now.getTime() - 12 * 86400000),
      },
      {
        id: '2',
        userId: 'user-1',
        content: '2',
        moodEmoji: '😊',
        sentimentLabel: 'positive',
        sentimentScore: 0.8,
        createdAt: new Date(now.getTime() - 10 * 86400000),
        updatedAt: new Date(now.getTime() - 10 * 86400000),
      },
      {
        id: '3',
        userId: 'user-1',
        content: '3',
        moodEmoji: '😊',
        sentimentLabel: 'positive',
        sentimentScore: 0.75,
        createdAt: new Date(now.getTime() - 9 * 86400000),
        updatedAt: new Date(now.getTime() - 9 * 86400000),
      },
    ];

    repository.findByUserIdSince.mockResolvedValue(mockEntries as any);

    const result = await useCase.execute('user-1', 14);

    expect(result.points).toHaveLength(3);
    expect(result.summary.trend).toBe('insufficient_data');
  });

  it('đánh giá xu hướng: cải thiện (improving) khi diff > 0.15', async () => {
    const now = new Date();
    // Nửa đầu (trước 7 ngày): ngày -11 (-0.6), ngày -9 (-0.4) -> avg = -0.5
    // Nửa sau (trong 7 ngày): ngày -3 (0.6), ngày -1 (0.8) -> avg = 0.7
    // diff = 0.7 - (-0.5) = 1.2 > 0.15
    const mockEntries = [
      {
        id: '1',
        userId: 'user-1',
        content: '1',
        sentimentLabel: 'negative',
        sentimentScore: -0.6,
        createdAt: new Date(now.getTime() - 11 * 86400000),
        updatedAt: new Date(now.getTime() - 11 * 86400000),
      },
      {
        id: '2',
        userId: 'user-1',
        content: '2',
        sentimentLabel: 'negative',
        sentimentScore: -0.4,
        createdAt: new Date(now.getTime() - 9 * 86400000),
        updatedAt: new Date(now.getTime() - 9 * 86400000),
      },
      {
        id: '3',
        userId: 'user-1',
        content: '3',
        sentimentLabel: 'positive',
        sentimentScore: 0.6,
        createdAt: new Date(now.getTime() - 3 * 86400000),
        updatedAt: new Date(now.getTime() - 3 * 86400000),
      },
      {
        id: '4',
        userId: 'user-1',
        content: '4',
        sentimentLabel: 'positive',
        sentimentScore: 0.8,
        createdAt: new Date(now.getTime() - 1 * 86400000),
        updatedAt: new Date(now.getTime() - 1 * 86400000),
      },
    ];

    repository.findByUserIdSince.mockResolvedValue(mockEntries as any);

    const result = await useCase.execute('user-1', 14);

    expect(result.points).toHaveLength(4);
    expect(result.summary.trend).toBe('improving');
  });

  it('đánh giá xu hướng: đi xuống (declining) khi diff < -0.15', async () => {
    const now = new Date();
    // Nửa đầu: ngày -11 (0.8), ngày -9 (0.6) -> avg = 0.7
    // Nửa sau: ngày -3 (-0.3), ngày -1 (-0.5) -> avg = -0.4
    // diff = -0.4 - 0.7 = -1.1 < -0.15
    const mockEntries = [
      {
        id: '1',
        userId: 'user-1',
        content: '1',
        sentimentLabel: 'positive',
        sentimentScore: 0.8,
        createdAt: new Date(now.getTime() - 11 * 86400000),
        updatedAt: new Date(now.getTime() - 11 * 86400000),
      },
      {
        id: '2',
        userId: 'user-1',
        content: '2',
        sentimentLabel: 'positive',
        sentimentScore: 0.6,
        createdAt: new Date(now.getTime() - 9 * 86400000),
        updatedAt: new Date(now.getTime() - 9 * 86400000),
      },
      {
        id: '3',
        userId: 'user-1',
        content: '3',
        sentimentLabel: 'negative',
        sentimentScore: -0.3,
        createdAt: new Date(now.getTime() - 3 * 86400000),
        updatedAt: new Date(now.getTime() - 3 * 86400000),
      },
      {
        id: '4',
        userId: 'user-1',
        content: '4',
        sentimentLabel: 'negative',
        sentimentScore: -0.5,
        createdAt: new Date(now.getTime() - 1 * 86400000),
        updatedAt: new Date(now.getTime() - 1 * 86400000),
      },
    ];

    repository.findByUserIdSince.mockResolvedValue(mockEntries as any);

    const result = await useCase.execute('user-1', 14);

    expect(result.points).toHaveLength(4);
    expect(result.summary.trend).toBe('declining');
  });

  it('đánh giá xu hướng: tương đối ổn định (stable) khi -0.15 <= diff <= 0.15', async () => {
    const now = new Date();
    // Nửa đầu: ngày -10 (0.4), ngày -8 (0.5) -> avg = 0.45
    // Nửa sau: ngày -2 (0.48), ngày -1 (0.52) -> avg = 0.50
    // diff = 0.50 - 0.45 = 0.05
    const mockEntries = [
      {
        id: '1',
        userId: 'user-1',
        content: '1',
        sentimentLabel: 'positive',
        sentimentScore: 0.4,
        createdAt: new Date(now.getTime() - 10 * 86400000),
        updatedAt: new Date(now.getTime() - 10 * 86400000),
      },
      {
        id: '2',
        userId: 'user-1',
        content: '2',
        sentimentLabel: 'positive',
        sentimentScore: 0.5,
        createdAt: new Date(now.getTime() - 8 * 86400000),
        updatedAt: new Date(now.getTime() - 8 * 86400000),
      },
      {
        id: '3',
        userId: 'user-1',
        content: '3',
        sentimentLabel: 'positive',
        sentimentScore: 0.48,
        createdAt: new Date(now.getTime() - 2 * 86400000),
        updatedAt: new Date(now.getTime() - 2 * 86400000),
      },
      {
        id: '4',
        userId: 'user-1',
        content: '4',
        sentimentLabel: 'positive',
        sentimentScore: 0.52,
        createdAt: new Date(now.getTime() - 1 * 86400000),
        updatedAt: new Date(now.getTime() - 1 * 86400000),
      },
    ];

    repository.findByUserIdSince.mockResolvedValue(mockEntries as any);

    const result = await useCase.execute('user-1', 14);

    expect(result.points).toHaveLength(4);
    expect(result.summary.trend).toBe('stable');
  });
});
