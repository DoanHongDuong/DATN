import { apiClient } from './client';

export interface RelaxationResource {
  id: string;
  title: string;
  type: 'BREATHING' | 'AUDIO' | 'ARTICLE' | 'VIDEO' | string;
  url: string;
  durationSeconds: number | null;
  category: string;
  createdAt: string;
}

export const resourceApi = {
  getAll: async (category?: string): Promise<RelaxationResource[]> => {
    const res = await apiClient.get('/journal/resources/all', {
      params: category && category !== 'all' ? { category } : undefined,
    });
    return res.data;
  },
};
