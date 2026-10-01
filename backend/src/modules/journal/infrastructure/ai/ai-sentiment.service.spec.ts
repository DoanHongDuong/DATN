import { ConfigService } from '@nestjs/config';
import { AiSentimentService, SYSTEM_PROMPT } from './ai-sentiment.service';

describe('AiSentimentService', () => {
  let service: AiSentimentService;
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'GEMINI_API_KEY') {
          return 'fake-test-key';
        }
        return undefined;
      }),
    } as unknown as ConfigService;

    service = new AiSentimentService(configService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should parse and return structured sentiment data on success', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
      text: JSON.stringify({
        sentiment_label: 'positive',
        sentiment_score: 0.85,
        suggested_resource_category: 'none',
      }),
    });

    (service as unknown as { ai: { models: { generateContent: typeof mockGenerateContent } } }).ai = {
      models: {
        generateContent: mockGenerateContent,
      },
    };

    const result = await service.analyze('Hôm nay tôi cảm thấy rất vui và yêu đời.');

    expect(mockGenerateContent).toHaveBeenCalledWith({
      model: 'gemini-3.5-flash-lite',
      contents: `${SYSTEM_PROMPT}\n\nNhật ký: "Hôm nay tôi cảm thấy rất vui và yêu đời."`,
      config: { responseMimeType: 'application/json' },
    });

    expect(result).toEqual({
      sentimentLabel: 'positive',
      sentimentScore: 0.85,
      suggestedResourceCategory: 'none',
    });
  });

  it('should clean markdown json backticks if returned by model', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
      text: '```json\n{"sentiment_label":"crisis","sentiment_score":-0.95,"suggested_resource_category":"breathing"}\n```',
    });

    (service as unknown as { ai: { models: { generateContent: typeof mockGenerateContent } } }).ai = {
      models: {
        generateContent: mockGenerateContent,
      },
    };

    const result = await service.analyze('Tôi cảm thấy tuyệt vọng');

    expect(result).toEqual({
      sentimentLabel: 'crisis',
      sentimentScore: -0.95,
      suggestedResourceCategory: 'breathing',
    });
  });

  it('should safely return fallback on API failure without throwing exception', async () => {
    const mockGenerateContent = jest.fn().mockRejectedValue(new Error('Gemini API Error 503'));

    (service as unknown as { ai: { models: { generateContent: typeof mockGenerateContent } } }).ai = {
      models: {
        generateContent: mockGenerateContent,
      },
    };

    const result = await service.analyze('Bất kỳ nội dung nào');

    expect(result).toEqual({
      sentimentLabel: null,
      sentimentScore: null,
      suggestedResourceCategory: null,
    });
  });

  it('should safely return fallback on invalid JSON response', async () => {
    const mockGenerateContent = jest.fn().mockResolvedValue({
      text: 'Không phải JSON',
    });

    (service as unknown as { ai: { models: { generateContent: typeof mockGenerateContent } } }).ai = {
      models: {
        generateContent: mockGenerateContent,
      },
    };

    const result = await service.analyze('Nhật ký');

    expect(result).toEqual({
      sentimentLabel: null,
      sentimentScore: null,
      suggestedResourceCategory: null,
    });
  });

  it('should safely return fallback when apiKey is missing', async () => {
    const emptyConfigService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;

    const noKeyService = new AiSentimentService(emptyConfigService);
    const result = await noKeyService.analyze('Test content');

    expect(result).toEqual({
      sentimentLabel: null,
      sentimentScore: null,
      suggestedResourceCategory: null,
    });
  });
});
