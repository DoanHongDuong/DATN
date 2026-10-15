import { Inject, Injectable } from '@nestjs/common';
import {
  JOURNAL_REPOSITORY,
  IJournalRepository,
  RelaxationResourceEntity,
} from '../../domain/repositories/journal.repository.interface';

@Injectable()
export class GetAllRelaxationResourcesUseCase {
  constructor(
    @Inject(JOURNAL_REPOSITORY)
    private readonly journalRepository: IJournalRepository,
  ) {}

  async execute(category?: string): Promise<RelaxationResourceEntity[]> {
    const normalizedCategory = category ? category.trim().toLowerCase() : '';

    if (normalizedCategory && normalizedCategory !== 'all') {
      return this.journalRepository.findRelaxationResourcesByCategory(normalizedCategory);
    }

    return this.journalRepository.findAllRelaxationResources();
  }
}
