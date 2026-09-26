import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { IAssessmentRepository } from '../../domain/repositories/assessment.repository.interface';
import { SubmitTestDto } from '../dto/submit-test.dto';
import { getSeverityLevel } from '../../infrastructure/constants/severity-thresholds.constant';

@Injectable()
export class SubmitTestUseCase {
  constructor(
    @Inject('IAssessmentRepository')
    private readonly repository: IAssessmentRepository,
  ) {}

  async execute(userId: string, testId: string, dto: SubmitTestDto) {
    const test = await this.repository.findTestById(testId);
    if (!test) {
      throw new NotFoundException('Test not found');
    }

    const testQuestions = await this.repository.findQuestionsByTestId(testId);
    
    // Validate that all questions are answered
    if (dto.answers.length !== testQuestions.length) {
      throw new BadRequestException('Answers count does not match questions count');
    }

    let totalScore = 0;
    const answeredQuestionIds = new Set<string>();

    for (const answer of dto.answers) {
      if (answeredQuestionIds.has(answer.questionId)) {
         throw new BadRequestException(`Duplicate answer for question ${answer.questionId}`);
      }
      answeredQuestionIds.add(answer.questionId);

      const question = testQuestions.find(q => q.id === answer.questionId);
      if (!question) {
        throw new BadRequestException(`Question ${answer.questionId} does not belong to this test`);
      }

      const option = question.options.find(o => o.id === answer.optionId);
      if (!option) {
        throw new BadRequestException(`Option ${answer.optionId} does not belong to question ${answer.questionId}`);
      }

      totalScore += option.scoreValue;
    }

    const severityLevel = getSeverityLevel(test.code, totalScore);

    const result = await this.repository.saveTestResult({
      userId,
      testId,
      totalScore,
      severityLevel,
      answers: dto.answers,
    });

    return {
      result,
      severityLevel,
    };
  }
}
