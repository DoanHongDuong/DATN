export type SentimentLabel = 'positive' | 'neutral' | 'negative' | 'crisis';
export type SuggestedResourceCategory = 'breathing' | 'calm_audio' | 'none';

export interface SentimentAnalysisResult {
  sentimentLabel: SentimentLabel | null;
  sentimentScore: number | null;
  suggestedResourceCategory: SuggestedResourceCategory | null;
}

export interface IAiSentimentService {
  analyze(content: string): Promise<SentimentAnalysisResult>;
}
