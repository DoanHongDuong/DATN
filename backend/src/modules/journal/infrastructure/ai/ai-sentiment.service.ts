import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

import {
  IAiSentimentService,
  SentimentAnalysisResult,
  SentimentLabel,
  SuggestedResourceCategory,
} from '../../domain/services/ai-sentiment.service.interface';

export const SYSTEM_PROMPT = `Phân tích cảm xúc của đoạn nhật ký sau (tiếng Việt), trả về JSON đúng định dạng:
{
  "sentiment_label": "positive" | "neutral" | "negative" | "crisis",
  "sentiment_score": số từ -1.0 đến 1.0,
  "suggested_resource_category": "breathing" | "calm_audio" | "none"
}
Không giải thích gì thêm, chỉ trả về đúng JSON.`;

export type { SentimentAnalysisResult, SentimentLabel, SuggestedResourceCategory };

@Injectable()
export class AiSentimentService implements IAiSentimentService {
  private readonly logger = new Logger(AiSentimentService.name);
  private readonly ai: GoogleGenAI | null = null;
  private readonly timeoutMs = 10000; // 10 seconds timeout as specified in NFR-03
  private readonly model = 'gemini-3.5-flash-lite';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    } else {
      this.logger.warn('GEMINI_API_KEY is not configured in ConfigService.');
    }
  }

  async analyze(content: string): Promise<SentimentAnalysisResult> {
    const fallbackResult: SentimentAnalysisResult = {
      sentimentLabel: null,
      sentimentScore: null,
      suggestedResourceCategory: null,
    };

    if (!this.ai) {
      this.logger.warn('GoogleGenAI client is not initialized. Skipping sentiment analysis.');
      return fallbackResult;
    }

    try {
      let timeoutHandle: NodeJS.Timeout;

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error('AI sentiment analysis timed out after 10 seconds'));
        }, this.timeoutMs);
      });

      const generatePromise = this.ai.models.generateContent({
        model: this.model,
        contents: `${SYSTEM_PROMPT}\n\nNhật ký: "${content}"`,
        config: { responseMimeType: 'application/json' },
      });

      const response = await Promise.race([generatePromise, timeoutPromise]).finally(() => {
        clearTimeout(timeoutHandle);
      });

      const rawText = response.text?.trim() ?? '{}';
      const cleanJson = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '');

      const result = JSON.parse(cleanJson);

      return this.validateAndFormatResult(result);
    } catch (error) {
      // Do NOT log sensitive journal entry content per AGENTS.md security guidelines
      this.logger.error(
        `AI sentiment analysis failed or timed out: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return fallbackResult;
    }
  }

  private validateAndFormatResult(data: Record<string, unknown>): SentimentAnalysisResult {
    const validLabels: SentimentLabel[] = ['positive', 'neutral', 'negative', 'crisis'];
    const validCategories: SuggestedResourceCategory[] = ['breathing', 'calm_audio', 'none'];

    const rawLabel = typeof data.sentiment_label === 'string' ? data.sentiment_label.toLowerCase() : null;
    const sentimentLabel = validLabels.includes(rawLabel as SentimentLabel) ? (rawLabel as SentimentLabel) : null;

    let sentimentScore: number | null = null;
    if (typeof data.sentiment_score === 'number' && !Number.isNaN(data.sentiment_score)) {
      sentimentScore = Math.max(-1.0, Math.min(1.0, data.sentiment_score));
    }

    const rawCategory =
      typeof data.suggested_resource_category === 'string' ? data.suggested_resource_category.toLowerCase() : null;
    const suggestedResourceCategory = validCategories.includes(rawCategory as SuggestedResourceCategory)
      ? (rawCategory as SuggestedResourceCategory)
      : null;

    return {
      sentimentLabel,
      sentimentScore,
      suggestedResourceCategory,
    };
  }
}
