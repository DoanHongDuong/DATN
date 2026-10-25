import { UserProfileEntity } from '../entities/user-profile.entity';

export const USER_PROFILE_REPOSITORY = Symbol('USER_PROFILE_REPOSITORY');

export interface UpdateUserProfileData {
  fullName?: string;
  phone?: string | null;
}

export interface IUserProfileRepository {
  findById(id: string): Promise<UserProfileEntity | null>;
  update(id: string, data: UpdateUserProfileData): Promise<UserProfileEntity>;
}
