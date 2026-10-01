import { JournalEntry } from '@prisma/client';

export const JOURNAL_REPOSITORY = 'IJournalRepository';

export interface CreateJournalEntryData {
  userId: string;
  content: string;
  moodEmoji?: string;
  sentimentLabel?: string | null;
  sentimentScore?: number | null;
}

export interface UpdateJournalEntryData {
  content?: string;
  moodEmoji?: string;
  sentimentLabel?: string | null;
  sentimentScore?: number | null;
}

export interface RelaxationResourceEntity {
  id: string;
  title: string;
  type: string;
  url: string;
  durationSeconds: number | null;
  category: string;
  createdAt: Date;
}

export interface IJournalRepository {
  create(data: CreateJournalEntryData): Promise<JournalEntry>;
  findById(id: string): Promise<JournalEntry | null>;
  findByUserId(userId: string, skip: number, take: number): Promise<JournalEntry[]>;
  countByUserId(userId: string): Promise<number>;
  update(id: string, data: UpdateJournalEntryData): Promise<JournalEntry>;
  delete(id: string): Promise<void>;
  findRelaxationResourcesByCategory(category: string): Promise<RelaxationResourceEntity[]>;
  findAllRelaxationResources(): Promise<RelaxationResourceEntity[]>;
}
