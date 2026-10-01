import { Inject, Injectable } from '@nestjs/common';
import {
  JOURNAL_REPOSITORY,
  IJournalRepository,
} from '../../domain/repositories/journal.repository.interface';
import { EncryptionService } from '../../infrastructure/ai/encryption.service';

@Injectable()
export class GetJournalEntriesUseCase {
  constructor(
    @Inject(JOURNAL_REPOSITORY)
    private readonly journalRepository: IJournalRepository,
    private readonly encryptionService: EncryptionService,
  ) {}

  async execute(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [entries, total] = await Promise.all([
      this.journalRepository.findByUserId(userId, skip, limit),
      this.journalRepository.countByUserId(userId),
    ]);

    const decryptedEntries = entries.map((entry) => ({
      ...entry,
      content: this.encryptionService.decrypt(entry.content),
    }));

    return {
      data: decryptedEntries,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export { GetJournalEntriesUseCase as GetJournalHistoryUseCase };
