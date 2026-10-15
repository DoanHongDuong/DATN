import { VolunteerProfileEntity } from '../entities/volunteer-profile.entity';

export const VOLUNTEER_REPOSITORY = Symbol('VOLUNTEER_REPOSITORY');

export interface CreateVolunteerProfileData {
  userId: string;
  specialization?: string | null;
  bio?: string | null;
  certificateUrl?: string | null;
}

export interface IVolunteerRepository {
  findByUserId(userId: string): Promise<VolunteerProfileEntity | null>;
  create(data: CreateVolunteerProfileData): Promise<VolunteerProfileEntity>;
  updateOnlineStatus(userId: string, isOnline: boolean): Promise<VolunteerProfileEntity>;
}
