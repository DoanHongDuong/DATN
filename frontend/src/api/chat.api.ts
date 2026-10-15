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
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  sentAt?: string;
  createdAt: string;
}

export interface RequestSupportResponse {
  noVolunteerAvailable: boolean;
  session?: ChatSession;
  hotline?: string;
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
};
