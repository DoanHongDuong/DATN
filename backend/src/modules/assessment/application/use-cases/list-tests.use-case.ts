import { Inject, Injectable } from '@nestjs/common';
import { IAssessmentRepository } from '../../domain/repositories/assessment.repository.interface';
import { PsychologicalTest } from '@prisma/client';

@Injectable()
export class ListTestsUseCase {
  constructor(
    @Inject('IAssessmentRepository')
    private readonly repository: IAssessmentRepository,
  ) {}

  async execute(): Promise<PsychologicalTest[]> {
    return this.repository.findTests();
  }
}
