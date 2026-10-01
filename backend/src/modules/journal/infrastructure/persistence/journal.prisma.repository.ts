import { Injectable } from '@nestjs/common';
import { JournalEntry } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  IJournalRepository,
  CreateJournalEntryData,
  UpdateJournalEntryData,
} from '../../domain/repositories/journal.repository.interface';

@Injectable()
export class JournalPrismaRepository implements IJournalRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateJournalEntryData): Promise<JournalEntry> {
    return this.prisma.journalEntry.create({
      data: {
        userId: data.userId,
        content: data.content,
        moodEmoji: data.moodEmoji,
        sentimentLabel: data.sentimentLabel,
        sentimentScore: data.sentimentScore,
      },
    });
  }

  async findById(id: string): Promise<JournalEntry | null> {
    return this.prisma.journalEntry.findUnique({
      where: { id },
    });
  }

  async findByUserId(userId: string, skip: number, take: number): Promise<JournalEntry[]> {
    return this.prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.journalEntry.count({
      where: { userId },
    });
  }

  async update(id: string, data: UpdateJournalEntryData): Promise<JournalEntry> {
    return this.prisma.journalEntry.update({
      where: { id },
      data: {
        content: data.content,
        moodEmoji: data.moodEmoji,
        sentimentLabel: data.sentimentLabel,
        sentimentScore: data.sentimentScore,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.journalEntry.delete({
      where: { id },
    });
  }

  async findRelaxationResourcesByCategory(category: string) {
    return this.prisma.relaxationResource.findMany({
      where: { category },
    });
  }

  async findAllRelaxationResources() {
    return this.prisma.relaxationResource.findMany();
  }
}
