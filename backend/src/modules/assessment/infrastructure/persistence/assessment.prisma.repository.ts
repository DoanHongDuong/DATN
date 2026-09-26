import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../modules/auth/infrastructure/prisma/prisma.service'; // Wait, let's just create a shared prisma.service or import from auth if it's there? Wait, the PrismaService was in src/modules/auth/infrastructure/prisma/prisma.service.ts. I should use that one or make a generic one. Let me import it from there for now, or just assume there's one. Wait, let me adjust the import path later if needed.
import { PsychologicalTest, TestResult } from '@prisma/client';
import { IAssessmentRepository, QuestionWithOptions, TestSubmissionData } from '../../domain/repositories/assessment.repository.interface';

@Injectable()
export class AssessmentPrismaRepository implements IAssessmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTests(): Promise<PsychologicalTest[]> {
    return this.prisma.psychologicalTest.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async findTestById(testId: string): Promise<PsychologicalTest | null> {
    return this.prisma.psychologicalTest.findUnique({
      where: { id: testId },
    });
  }

  async findQuestionsByTestId(testId: string): Promise<QuestionWithOptions[]> {
    return this.prisma.testQuestion.findMany({
      where: { testId },
      include: {
        options: true,
      },
      orderBy: {
        orderNumber: 'asc',
      },
    });
  }

  async saveTestResult(data: TestSubmissionData): Promise<TestResult> {
    return this.prisma.$transaction(async (prisma) => {
      const result = await prisma.testResult.create({
        data: {
          userId: data.userId,
          testId: data.testId,
          totalScore: data.totalScore,
          severityLevel: data.severityLevel,
        },
      });

      const answersData = data.answers.map(ans => ({
        resultId: result.id,
        questionId: ans.questionId,
        optionId: ans.optionId,
      }));

      await prisma.testAnswer.createMany({
        data: answersData,
      });

      return result;
    });
  }

  async findTestHistoryByUserId(userId: string, skip: number, take: number): Promise<TestResult[]> {
    return this.prisma.testResult.findMany({
      where: { userId },
      include: {
        test: {
          select: { name: true, code: true }
        }
      },
      orderBy: { takenAt: 'desc' },
      skip,
      take,
    });
  }

  async countTestHistoryByUserId(userId: string): Promise<number> {
    return this.prisma.testResult.count({
      where: { userId },
    });
  }
}
