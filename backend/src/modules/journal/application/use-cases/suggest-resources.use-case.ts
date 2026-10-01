import { Inject, Injectable } from '@nestjs/common';
import {
  JOURNAL_REPOSITORY,
  IJournalRepository,
  RelaxationResourceEntity,
} from '../../domain/repositories/journal.repository.interface';

@Injectable()
export class SuggestResourcesUseCase {
  constructor(
    @Inject(JOURNAL_REPOSITORY)
    private readonly journalRepository: IJournalRepository,
  ) {}

  async execute(category?: string): Promise<RelaxationResourceEntity[]> {
    let resources: RelaxationResourceEntity[] = [];

    const normalizedCategory = category ? category.trim().toLowerCase() : '';

    if (normalizedCategory && normalizedCategory !== 'none') {
      resources = await this.journalRepository.findRelaxationResourcesByCategory(normalizedCategory);
    }

    // Fallback: If no resources found for category or category is 'none'/empty, fetch any available resources
    if (resources.length === 0) {
      resources = await this.journalRepository.findAllRelaxationResources();
    }

    if (resources.length <= 1) {
      return resources;
    }

    // Shuffle and pick 1 to 3 random resources
    const shuffled = [...resources].sort(() => 0.5 - Math.random());
    const maxAvailable = Math.min(3, shuffled.length);
    const count = Math.floor(Math.random() * maxAvailable) + 1;

    return shuffled.slice(0, count);
  }
}
