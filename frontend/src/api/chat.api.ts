import { apiClient } from './client';

export type SessionStatus = 'WAITING' | 'ACTIVE' | 'CLOSED';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ChatSession {
  id: string;
  userId: string;
  volunteerId: string | null;
  status: SessionStatus;
  priorityLevel: PriorityLevel;
  queuedAt?: string;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  sentAt?: string;
  isRead?: boolean;
  createdAt?: string;
}

export interface RequestSupportResponse {
  noVolunteerAvailable: boolean;
  session?: ChatSession;
  hotline?: string;
}

export interface SessionFeedback {
  id: string;
  sessionId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface CreateFeedbackPayload {
  rating: number;
  comment?: string;
}

export const chatApi = {
  requestSupport: async (): Promise<RequestSupportResponse> => {
    const res = await apiClient.post('/chat/request-support');
    return res.data;
  },

  getWaitingSessions: async (): Promise<ChatSession[]> => {
    const res = await apiClient.get('/chat/waiting-sessions');
    return res.data;
  },

  acceptSession: async (sessionId: string): Promise<ChatSession> => {
    const res = await apiClient.post(`/chat/${sessionId}/accept`);
    return res.data;
  },

  getQueuePosition: async (sessionId: string): Promise<{ position: number; status: string }> => {
    const res = await apiClient.get(`/chat/${sessionId}/queue-position`);
    return res.data;
  },

  getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    const res = await apiClient.get(`/chat/${sessionId}/messages`);
    return res.data;
  },

  getMyActiveSession: async (): Promise<ChatSession | null> => {
    const res = await apiClient.get<ChatSession | null>('/chat/my-active-session');
    return res.data;
  },

  cancelSession: async (sessionId: string): Promise<ChatSession> => {
    const res = await apiClient.post<ChatSession>(`/chat/${sessionId}/cancel`);
    return res.data;
  },

  submitFeedback: async (sessionId: string, payload: CreateFeedbackPayload): Promise<SessionFeedback> => {
    const res = await apiClient.post<SessionFeedback>(`/chat/${sessionId}/feedback`, payload);
    return res.data;
  },

  getFeedback: async (sessionId: string): Promise<SessionFeedback | null> => {
    const res = await apiClient.get<SessionFeedback | null>(`/chat/${sessionId}/feedback`);
    return res.data;
  },
};
