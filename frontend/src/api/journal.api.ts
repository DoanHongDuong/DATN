import { apiClient } from './client';

export interface CreateJournalPayload {
  content: string;
  moodEmoji?: string;
}

export interface UpdateJournalPayload {
  content?: string;
  moodEmoji?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  content: string;
  moodEmoji: string | null;
  sentimentLabel: string | null;
  sentimentScore: number | null;
  createdAt: string;
  updatedAt: string;
  suggestedResourceCategory?: string | null;
}

export interface RelaxationResource {
  id: string;
  title: string;
  type: string;
  url: string;
  durationSeconds: number | null;
  category: string;
}

export const journalApi = {
  create: async (payload: CreateJournalPayload): Promise<JournalEntry> => {
    const res = await apiClient.post('/journal', payload);
    return res.data;
  },

  findAll: async (page = 1, limit = 10): Promise<{ data: JournalEntry[]; total: number }> => {
    const res = await apiClient.get('/journal', { params: { page, limit } });
    return res.data;
  },

  getResources: async (category?: string): Promise<RelaxationResource[]> => {
    const res = await apiClient.get('/journal/resources', { params: { category } });
    return res.data;
  },

  update: async (id: string, payload: UpdateJournalPayload): Promise<JournalEntry> => {
    const res = await apiClient.patch(`/journal/${id}`, payload);
    return res.data;
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const res = await apiClient.delete(`/journal/${id}`);
    return res.data;
  },
};
