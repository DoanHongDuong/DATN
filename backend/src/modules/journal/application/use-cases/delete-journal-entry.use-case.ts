import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  JOURNAL_REPOSITORY,
  IJournalRepository,
} from '../../domain/repositories/journal.repository.interface';

@Injectable()
export class DeleteJournalEntryUseCase {
  constructor(
    @Inject(JOURNAL_REPOSITORY)
    private readonly journalRepository: IJournalRepository,
  ) {}

  async execute(userId: string, entryId: string) {
    const existing = await this.journalRepository.findById(entryId);
    if (!existing) {
      throw new NotFoundException('Journal entry not found');
    }
    if (existing.userId !== userId) {
      throw new ForbiddenException('You can only delete your own journal entries');
    }

    await this.journalRepository.delete(entryId);

    return { message: 'Journal entry deleted successfully' };
  }
}
