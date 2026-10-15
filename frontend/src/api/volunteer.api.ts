import { apiClient } from './client';

export interface VolunteerProfile {
  id: string;
  userId: string;
  specialization: string | null;
  bio: string | null;
  certificateUrl: string | null;
  isVerified: boolean;
  isOnline: boolean;
  createdAt: string;
}

export interface ApplyVolunteerPayload {
  specialization: string;
  bio: string;
  certificateUrl?: string;
}

export const volunteerApi = {
  apply: async (payload: ApplyVolunteerPayload): Promise<VolunteerProfile> => {
    const res = await apiClient.post<VolunteerProfile>('/volunteers/apply', payload);
    return res.data;
  },

  getMyProfile: async (): Promise<VolunteerProfile | null> => {
    const res = await apiClient.get<VolunteerProfile | null>('/volunteers/me');
    return res.data;
  },

  updateOnlineStatus: async (isOnline: boolean): Promise<VolunteerProfile> => {
    const res = await apiClient.patch<VolunteerProfile>('/volunteers/me/online', { isOnline });
    return res.data;
  },
};
