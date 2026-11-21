import { apiClient } from './client';

export interface AssessmentTest {
  id: string;
  code: string;
  name: string;
  title?: string;
  description: string;
  maxScore?: number;
}

export interface TestOption {
  id: string;
  content: string;
  text?: string;
  scoreValue: number;
  score?: number;
}

export interface TestQuestion {
  id: string;
  content: string;
  orderNumber: number;
  order?: number;
  options: TestOption[];
}

export interface AnswerItem {
  questionId: string;
  optionId: string;
}

export interface SubmitTestPayload {
  answers: AnswerItem[];
}

export interface TestResultResponse {
  id: string;
  testId: string;
  totalScore: number;
  severityLevel: string;
  recommendation?: string;
  takenAt?: string;
  createdAt?: string;
  test?: {
    name: string;
    code: string;
  };
}

export interface GetHistoryResponse {
  data: TestResultResponse[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  total?: number;
}

export const assessmentApi = {
  listTests: async (): Promise<AssessmentTest[]> => {
    const res = await apiClient.get('/assessments');
    return res.data;
  },

  getQuestions: async (testId: string): Promise<TestQuestion[]> => {
    const res = await apiClient.get(`/assessments/${testId}/questions`);
    return res.data;
  },

  submitTest: async (testId: string, payload: SubmitTestPayload): Promise<TestResultResponse> => {
    const res = await apiClient.post(`/assessments/${testId}/submit`, payload);
    return res.data;
  },

  getHistory: async (page = 1, limit = 10): Promise<GetHistoryResponse> => {
    const res = await apiClient.get('/assessments/history', { params: { page, limit } });
    return res.data;
  },
};
