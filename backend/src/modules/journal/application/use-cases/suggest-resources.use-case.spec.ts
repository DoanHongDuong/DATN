import { SuggestResourcesUseCase } from './suggest-resources.use-case';
import { IJournalRepository, RelaxationResourceEntity } from '../../domain/repositories/journal.repository.interface';

describe('SuggestResourcesUseCase', () => {
  let useCase: SuggestResourcesUseCase;
  let repository: jest.Mocked<IJournalRepository>;

  const mockBreathingResources: RelaxationResourceEntity[] = [
    { id: '1', title: 'Thở sâu 4-7-8', type: 'BREATHING', url: 'https://example.com/1', durationSeconds: 300, category: 'breathing', createdAt: new Date() },
    { id: '2', title: 'Thở hộp (Box breathing)', type: 'BREATHING', url: 'https://example.com/2', durationSeconds: 240, category: 'breathing', createdAt: new Date() },
  ];

  const mockAllResources: RelaxationResourceEntity[] = [
    ...mockBreathingResources,
    { id: '3', title: 'Âm thanh mưa', type: 'AUDIO', url: 'https://example.com/3', durationSeconds: 600, category: 'calm_audio', createdAt: new Date() },
    { id: '4', title: 'Nhạc lofi', type: 'AUDIO', url: 'https://example.com/4', durationSeconds: 900, category: 'calm_audio', createdAt: new Date() },
  ];

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      countByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findRelaxationResourcesByCategory: jest.fn(),
      findAllRelaxationResources: jest.fn(),
    };

    useCase = new SuggestResourcesUseCase(repository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return resources for a specific category', async () => {
    repository.findRelaxationResourcesByCategory.mockResolvedValue(mockBreathingResources);

    const result = await useCase.execute('breathing');

    expect(repository.findRelaxationResourcesByCategory).toHaveBeenCalledWith('breathing');
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.length).toBeLessThanOrEqual(3);
    for (const r of result) {
      expect(r.category).toBe('breathing');
    }
  });

  it('should fallback to all resources when category is "none"', async () => {
    repository.findAllRelaxationResources.mockResolvedValue(mockAllResources);

    const result = await useCase.execute('none');

    expect(repository.findRelaxationResourcesByCategory).not.toHaveBeenCalled();
    expect(repository.findAllRelaxationResources).toHaveBeenCalled();
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it('should fallback to all resources when category has no matching items', async () => {
    repository.findRelaxationResourcesByCategory.mockResolvedValue([]);
    repository.findAllRelaxationResources.mockResolvedValue(mockAllResources);

    const result = await useCase.execute('unknown_category');

    expect(repository.findRelaxationResourcesByCategory).toHaveBeenCalledWith('unknown_category');
    expect(repository.findAllRelaxationResources).toHaveBeenCalled();
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('should return empty array if no resources exist in database', async () => {
    repository.findRelaxationResourcesByCategory.mockResolvedValue([]);
    repository.findAllRelaxationResources.mockResolvedValue([]);

    const result = await useCase.execute('breathing');

    expect(result).toEqual([]);
  });
});
