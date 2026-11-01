import { Injectable } from '@nestjs/common';
import { Role, AccountStatus, SessionStatus, SeverityLevel, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  IAdminRepository,
  CreateRelaxationResourceData,
  UpdateRelaxationResourceData,
  GetAuditLogsParams,
} from '../../domain/repositories/admin.repository.interface';
import {
  PendingVolunteerProfileEntity,
  AdminUserEntity,
  PaginatedUsersResult,
  AdminRelaxationResourceEntity,
  PaginatedAuditLogsResult,
  SystemStatsEntity,
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

  async getAllResources(category?: string): Promise<AdminRelaxationResourceEntity[]> {
    const where = category ? { category } : {};
    return this.prisma.relaxationResource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findResourceById(id: string): Promise<AdminRelaxationResourceEntity | null> {
    return this.prisma.relaxationResource.findUnique({
      where: { id },
    });
  }

  async createResource(
    actorId: string,
    data: CreateRelaxationResourceData,
  ): Promise<AdminRelaxationResourceEntity> {
    return this.prisma.$transaction(async (tx) => {
      const resource = await tx.relaxationResource.create({
        data: {
          title: data.title,
          type: data.type,
          url: data.url,
          durationSeconds: data.durationSeconds ?? null,
          category: data.category,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'CREATE_RESOURCE',
          targetId: resource.id,
          description: `Tạo tài nguyên thư giãn mới: "${resource.title}" (${resource.category})`,
        },
      });

      return resource;
    });
  }

  async updateResource(
    actorId: string,
    id: string,
    data: UpdateRelaxationResourceData,
  ): Promise<AdminRelaxationResourceEntity> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.relaxationResource.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.type !== undefined && { type: data.type }),
          ...(data.url !== undefined && { url: data.url }),
          ...(data.durationSeconds !== undefined && { durationSeconds: data.durationSeconds }),
          ...(data.category !== undefined && { category: data.category }),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'UPDATE_RESOURCE',
          targetId: id,
          description: `Cập nhật tài nguyên thư giãn: "${updated.title}"`,
        },
      });

      return updated;
    });
  }

  async deleteResource(actorId: string, id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const resource = await tx.relaxationResource.findUnique({ where: { id } });
      await tx.relaxationResource.delete({
        where: { id },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'DELETE_RESOURCE',
          targetId: id,
          description: `Xoá tài nguyên thư giãn: "${resource?.title || id}"`,
        },
      });
    });
  }

  async getAuditLogs(params: GetAuditLogsParams): Promise<PaginatedAuditLogsResult> {
    const { page, limit, action, from, to } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (action) {
      where.action = { equals: action, mode: 'insensitive' };
    }

    if (from || to) {
      where.createdAt = {};
      if (from) {
        where.createdAt.gte = new Date(from);
      }
      if (to) {
        const toDate = new Date(to);
        if (to.length === 10) {
          toDate.setHours(23, 59, 59, 999);
        }
        where.createdAt.lte = toDate;
      }
    }

    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      data: items.map((item) => ({
        id: item.id,
        actorId: item.actorId,
        action: item.action,
        targetId: item.targetId,
        description: item.description,
        createdAt: item.createdAt,
        actor: {
          fullName: item.actor.fullName,
          email: item.actor.email,
        },
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getSystemStats(): Promise<SystemStatsEntity> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      members,
      volunteers,
      admins,
      activeUsers,
      blockedUsers,
      onlineVolunteers,
      pendingVolunteers,
      totalSessions,
      waitingSessions,
      activeSessions,
      closedSessions,
      totalFeedbacks,
      feedbackAvg,
      totalAssessments,
      assessmentsBySeverity,
      totalJournals,
      journalsBySentiment,
      totalResources,
      recentSessions,
      recentAssessments,
      recentJournals,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: Role.USER } }),
      this.prisma.user.count({ where: { role: Role.VOLUNTEER } }),
      this.prisma.user.count({ where: { role: Role.ADMIN } }),
      this.prisma.user.count({ where: { status: AccountStatus.ACTIVE } }),
      this.prisma.user.count({ where: { status: AccountStatus.SUSPENDED } }),
      this.prisma.volunteerProfile.count({ where: { isOnline: true } }),
      this.prisma.volunteerProfile.count({ where: { isVerified: false } }),
      this.prisma.chatSession.count(),
      this.prisma.chatSession.count({ where: { status: SessionStatus.WAITING } }),
      this.prisma.chatSession.count({ where: { status: SessionStatus.ACTIVE } }),
      this.prisma.chatSession.count({ where: { status: SessionStatus.CLOSED } }),
      this.prisma.sessionFeedback.count(),
      this.prisma.sessionFeedback.aggregate({ _avg: { rating: true } }),
      this.prisma.testResult.count(),
      this.prisma.testResult.groupBy({
        by: ['severityLevel'],
        _count: { severityLevel: true },
      }),
      this.prisma.journalEntry.count(),
      this.prisma.journalEntry.groupBy({
        by: ['sentimentLabel'],
        _count: { sentimentLabel: true },
      }),
      this.prisma.relaxationResource.count(),
      this.prisma.chatSession.findMany({
        where: { queuedAt: { gte: sevenDaysAgo } },
        select: { queuedAt: true },
      }),
      this.prisma.testResult.findMany({
        where: { takenAt: { gte: sevenDaysAgo } },
        select: { takenAt: true },
      }),
      this.prisma.journalEntry.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
    ]);

    const severityMap: Record<string, number> = {
      minimal: 0,
      mild: 0,
      moderate: 0,
      moderatelySevere: 0,
      severe: 0,
    };
    for (const item of assessmentsBySeverity) {
      if (item.severityLevel === SeverityLevel.MINIMAL) severityMap.minimal = item._count.severityLevel;
      else if (item.severityLevel === SeverityLevel.MILD) severityMap.mild = item._count.severityLevel;
      else if (item.severityLevel === SeverityLevel.MODERATE) severityMap.moderate = item._count.severityLevel;
      else if (item.severityLevel === SeverityLevel.MODERATELY_SEVERE) severityMap.moderatelySevere = item._count.severityLevel;
      else if (item.severityLevel === SeverityLevel.SEVERE) severityMap.severe = item._count.severityLevel;
    }

    const sentimentMap: Record<string, number> = {
      positive: 0,
      neutral: 0,
      negative: 0,
      crisis: 0,
    };
    for (const item of journalsBySentiment) {
      const label = item.sentimentLabel?.toLowerCase();
      if (label && label in sentimentMap) {
        sentimentMap[label] = item._count.sentimentLabel;
      }
    }

    const recentActivity: Array<{
      date: string;
      sessions: number;
      assessments: number;
      journals: number;
    }> = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];

      const sCount = recentSessions.filter(
        (s) => new Date(s.queuedAt).toISOString().split('T')[0] === dateStr,
      ).length;
      const aCount = recentAssessments.filter(
        (a) => new Date(a.takenAt).toISOString().split('T')[0] === dateStr,
      ).length;
      const jCount = recentJournals.filter(
        (j) => new Date(j.createdAt).toISOString().split('T')[0] === dateStr,
      ).length;

      recentActivity.push({
        date: dateStr,
        sessions: sCount,
        assessments: aCount,
        journals: jCount,
      });
    }

    return {
      users: {
        total: totalUsers,
        members,
        volunteers,
        admins,
        active: activeUsers,
        blocked: blockedUsers,
        onlineVolunteers,
        pendingVolunteers,
      },
      sessions: {
        total: totalSessions,
        waiting: waitingSessions,
        active: activeSessions,
        closed: closedSessions,
        totalFeedbacks,
        averageRating: Number((feedbackAvg._avg.rating || 0).toFixed(1)),
      },
      assessments: {
        total: totalAssessments,
        severityDistribution: {
          minimal: severityMap.minimal,
          mild: severityMap.mild,
          moderate: severityMap.moderate,
          moderatelySevere: severityMap.moderatelySevere,
          severe: severityMap.severe,
        },
      },
      journals: {
        total: totalJournals,
        sentimentDistribution: {
          positive: sentimentMap.positive,
          neutral: sentimentMap.neutral,
          negative: sentimentMap.negative,
          crisis: sentimentMap.crisis,
        },
      },
      resources: {
        total: totalResources,
      },
      recentActivity,
    };
  }
}
