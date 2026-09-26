import { PsychologicalTest, TestQuestion, TestOption, TestResult, TestAnswer, SeverityLevel } from '@prisma/client';

export type QuestionWithOptions = TestQuestion & {
  options: TestOption[];
};

export type TestSubmissionData = {
  userId: string;
  testId: string;
  totalScore: number;
  severityLevel: SeverityLevel;
  answers: {
    questionId: string;
    optionId: string;
  }[];
};

export interface IAssessmentRepository {
  findTests(): Promise<PsychologicalTest[]>;
  findTestById(testId: string): Promise<PsychologicalTest | null>;
  findQuestionsByTestId(testId: string): Promise<QuestionWithOptions[]>;
  saveTestResult(data: TestSubmissionData): Promise<TestResult>;
  findTestHistoryByUserId(userId: string, skip: number, take: number): Promise<TestResult[]>;
  countTestHistoryByUserId(userId: string): Promise<number>;
}
