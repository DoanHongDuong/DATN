import { Injectable } from '@nestjs/common';
import { Role, AccountStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { IAdminRepository } from '../../domain/repositories/admin.repository.interface';
import {
  PendingVolunteerProfileEntity,
  AdminUserEntity,
  PaginatedUsersResult,
} from '../../domain/entities/admin.entity';

@Injectable()
export class AdminPrismaRepository implements IAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getPendingVolunteers(): Promise<PendingVolunteerProfileEntity[]> {
    const list = await this.prisma.volunteerProfile.findMany({
      where: { isVerified: false },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    return list.map((item) => ({
      id: item.id,
      userId: item.userId,
      specialization: item.specialization,
      bio: item.bio,
      certificateUrl: item.certificateUrl,
      isVerified: item.isVerified,
      isOnline: item.isOnline,
      createdAt: item.createdAt,
      user: {
        fullName: item.user.fullName,
        email: item.user.email,
      },
    }));
  }

  async findVolunteerProfileById(
    profileId: string,
  ): Promise<{ id: string; userId: string; isVerified: boolean } | null> {
    return this.prisma.volunteerProfile.findUnique({
      where: { id: profileId },
      select: { id: true, userId: true, isVerified: true },
    });
  }

  async approveVolunteer(actorId: string, profileId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.volunteerProfile.update({
        where: { id: profileId },
        data: { isVerified: true },
      });
      await tx.user.update({
        where: { id: userId },
        data: { role: Role.VOLUNTEER },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          action: 'APPROVE_VOLUNTEER',
          targetId: userId,
          description: 'Duyệt hồ sơ tình nguyện viên',
        },
      });
    });
  }

  async rejectVolunteer(actorId: string, profileId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.volunteerProfile.delete({
        where: { id: profileId },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          action: 'REJECT_VOLUNTEER',
          targetId: userId,
          description: 'Từ chối hồ sơ tình nguyện viên',
        },
      });
    });
  }

  async getUsers(page: number, limit: number, search?: string): Promise<PaginatedUsersResult> {
    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          role: true,
          fullName: true,
          email: true,
          phone: true,
          avatarUrl: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      items: items.map((u) => ({
        id: u.id,
        role: u.role,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        avatarUrl: u.avatarUrl,
        status: u.status,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findUserById(userId: string): Promise<AdminUserEntity | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        fullName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateUserStatus(
    actorId: string,
    targetUserId: string,
    status: string,
    action: string,
    description: string,
  ): Promise<AdminUserEntity> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: targetUserId },
        data: { status: status as AccountStatus },
        select: {
          id: true,
          role: true,
          fullName: true,
          email: true,
          phone: true,
          avatarUrl: true,
          status: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action,
          targetId: targetUserId,
          description,
        },
      });

      return {
        id: updated.id,
        role: updated.role,
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phone,
        avatarUrl: updated.avatarUrl,
        status: updated.status,
        emailVerified: updated.emailVerified,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    });
  }
}
