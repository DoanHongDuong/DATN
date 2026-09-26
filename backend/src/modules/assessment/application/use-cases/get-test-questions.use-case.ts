import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IAssessmentRepository, QuestionWithOptions } from '../../domain/repositories/assessment.repository.interface';

@Injectable()
export class GetTestQuestionsUseCase {
  constructor(
    @Inject('IAssessmentRepository')
    private readonly repository: IAssessmentRepository,
  ) {}

  async execute(testId: string): Promise<QuestionWithOptions[]> {
    const test = await this.repository.findTestById(testId);
    if (!test) {
      throw new NotFoundException('Test not found');
    }
    return this.repository.findQuestionsByTestId(testId);
  }
}
