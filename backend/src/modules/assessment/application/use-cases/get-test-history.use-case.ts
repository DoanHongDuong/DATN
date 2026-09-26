import { Inject, Injectable } from '@nestjs/common';
import { IAssessmentRepository } from '../../domain/repositories/assessment.repository.interface';

@Injectable()
export class GetTestHistoryUseCase {
  constructor(
    @Inject('IAssessmentRepository')
    private readonly repository: IAssessmentRepository,
  ) {}

  async execute(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.repository.findTestHistoryByUserId(userId, skip, limit),
      this.repository.countTestHistoryByUserId(userId),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
