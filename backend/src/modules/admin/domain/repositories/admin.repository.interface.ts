import {
  PendingVolunteerProfileEntity,
  AdminUserEntity,
  PaginatedUsersResult,
  AdminRelaxationResourceEntity,
  PaginatedAuditLogsResult,
} from '../entities/admin.entity';

export const ADMIN_REPOSITORY = Symbol('ADMIN_REPOSITORY');

export interface CreateRelaxationResourceData {
  title: string;
  type: string;
  url: string;
  durationSeconds?: number | null;
  category: string;
}

export interface UpdateRelaxationResourceData {
  title?: string;
  type?: string;
  url?: string;
  durationSeconds?: number | null;
  category?: string;
}

export interface GetAuditLogsParams {
  page: number;
  limit: number;
  action?: string;
  from?: string;
  to?: string;
}

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
  getAllResources(category?: string): Promise<AdminRelaxationResourceEntity[]>;
  findResourceById(id: string): Promise<AdminRelaxationResourceEntity | null>;
  createResource(actorId: string, data: CreateRelaxationResourceData): Promise<AdminRelaxationResourceEntity>;
  updateResource(actorId: string, id: string, data: UpdateRelaxationResourceData): Promise<AdminRelaxationResourceEntity>;
  deleteResource(actorId: string, id: string): Promise<void>;
  getAuditLogs(params: GetAuditLogsParams): Promise<PaginatedAuditLogsResult>;
}
