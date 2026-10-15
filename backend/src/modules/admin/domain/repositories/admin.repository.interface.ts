import {
  PendingVolunteerProfileEntity,
  AdminUserEntity,
  PaginatedUsersResult,
} from '../entities/admin.entity';

export const ADMIN_REPOSITORY = Symbol('ADMIN_REPOSITORY');

export interface IAdminRepository {
  getPendingVolunteers(): Promise<PendingVolunteerProfileEntity[]>;
  findVolunteerProfileById(profileId: string): Promise<{ id: string; userId: string; isVerified: boolean } | null>;
  approveVolunteer(actorId: string, profileId: string, userId: string): Promise<void>;
  rejectVolunteer(actorId: string, profileId: string, userId: string): Promise<void>;
  getUsers(page: number, limit: number, search?: string): Promise<PaginatedUsersResult>;
  findUserById(userId: string): Promise<AdminUserEntity | null>;
  updateUserStatus(
    actorId: string,
    targetUserId: string,
    status: string,
    action: string,
    description: string,
  ): Promise<AdminUserEntity>;
}
