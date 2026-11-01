import { Inject, Injectable } from '@nestjs/common';
import {
  JOURNAL_REPOSITORY,
  IJournalRepository,
} from '../../domain/repositories/journal.repository.interface';

export interface MoodTrendPoint {
  date: string; // YYYY-MM-DD
  avgScore: number; // Normalized -1.0 to 1.0, rounded to 2 decimals
  dominantSentiment: string; // 'positive' | 'neutral' | 'negative' | 'crisis'
  moodEmojis: string[];
  entryCount: number;
}

export interface MoodTrendSummary {
  totalEntries: number;
  avgScore: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  crisisCount: number;
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
}

export interface MoodTrendResponse {
  days: number;
  points: MoodTrendPoint[];
  summary: MoodTrendSummary;
}

@Injectable()
export class GetMoodTrendUseCase {
  constructor(
    @Inject(JOURNAL_REPOSITORY)
    private readonly journalRepository: IJournalRepository,
  ) {}

  async execute(userId: string, days = 14): Promise<MoodTrendResponse> {
    const validDays = Math.max(1, Math.min(90, days || 14));
    const since = new Date(Date.now() - validDays * 24 * 60 * 60 * 1000);

    const entries = await this.journalRepository.findByUserIdSince(userId, since);

    if (entries.length === 0) {
      return {
        days: validDays,
        points: [],
        summary: {
          totalEntries: 0,
          avgScore: 0,
          positiveCount: 0,
          neutralCount: 0,
          negativeCount: 0,
          crisisCount: 0,
          trend: 'insufficient_data',
        },
      };
    }

    const getScore = (entry: (typeof entries)[number]): number => {
      if (typeof entry.sentimentScore === 'number' && !isNaN(entry.sentimentScore)) {
        return Math.max(-1, Math.min(1, entry.sentimentScore));
      }
      switch (entry.sentimentLabel?.toLowerCase()) {
        case 'positive':
          return 0.7;
        case 'neutral':
          return 0.0;
        case 'negative':
          return -0.6;
        case 'crisis':
          return -1.0;
        default:
          return 0.0;
      }
    };

    const groups = new Map<
      string,
      { scores: number[]; labels: string[]; emojis: string[] }
    >();

    let totalScoreSum = 0;
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;
    let crisisCount = 0;

    for (const entry of entries) {
      const dateKey = new Date(entry.createdAt).toISOString().split('T')[0];
      const score = getScore(entry);
      totalScoreSum += score;

      const label =
        entry.sentimentLabel?.toLowerCase() ||
        (score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral');

      if (label === 'positive') positiveCount++;
      else if (label === 'neutral') neutralCount++;
      else if (label === 'negative') negativeCount++;
      else if (label === 'crisis') crisisCount++;
      else neutralCount++;

      if (!groups.has(dateKey)) {
        groups.set(dateKey, { scores: [], labels: [], emojis: [] });
      }
      const group = groups.get(dateKey)!;
      group.scores.push(score);
      group.labels.push(label);
      if (entry.moodEmoji && !group.emojis.includes(entry.moodEmoji)) {
        group.emojis.push(entry.moodEmoji);
      }
    }

    const sortedDateKeys = Array.from(groups.keys()).sort();
    const points: MoodTrendPoint[] = sortedDateKeys.map((dateKey) => {
      const g = groups.get(dateKey)!;
      const avg = g.scores.reduce((a, b) => a + b, 0) / g.scores.length;

      const counts: Record<string, number> = {};
      for (const l of g.labels) {
        counts[l] = (counts[l] || 0) + 1;
      }
      let dominant = 'neutral';
      let maxCount = 0;
      for (const [sentiment, count] of Object.entries(counts)) {
        if (count > maxCount) {
          maxCount = count;
          dominant = sentiment;
        }
      }

      return {
        date: dateKey,
        avgScore: Number(avg.toFixed(2)),
        dominantSentiment: dominant,
        moodEmojis: g.emojis,
        entryCount: g.scores.length,
      };
    });

    let trend: 'improving' | 'stable' | 'declining' | 'insufficient_data' = 'insufficient_data';
    if (entries.length >= 2 && points.length >= 2) {
      const midpoint = Math.floor(points.length / 2);
      const earlierPoints = points.slice(0, midpoint);
      const recentPoints = points.slice(midpoint);

      const earlierAvg =
        earlierPoints.reduce((acc, p) => acc + p.avgScore, 0) / earlierPoints.length;
      const recentAvg =
        recentPoints.reduce((acc, p) => acc + p.avgScore, 0) / recentPoints.length;

      const diff = recentAvg - earlierAvg;
      if (diff > 0.15) {
        trend = 'improving';
      } else if (diff < -0.15) {
        trend = 'declining';
      } else {
        trend = 'stable';
      }
    } else if (entries.length >= 2) {
      trend = 'stable';
    }

    return {
      days: validDays,
      points,
      summary: {
        totalEntries: entries.length,
        avgScore: Number((totalScoreSum / entries.length).toFixed(2)),
        positiveCount,
        neutralCount,
        negativeCount,
        crisisCount,
        trend,
      },
    };
  }
}

