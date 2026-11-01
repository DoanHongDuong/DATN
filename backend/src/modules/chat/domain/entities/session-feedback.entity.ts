export interface SessionFeedbackEntity {
  id: string;
  sessionId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

