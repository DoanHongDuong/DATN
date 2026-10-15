"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminPrismaRepository = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
let AdminPrismaRepository = class AdminPrismaRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPendingVolunteers() {
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
    async findVolunteerProfileById(profileId) {
        return this.prisma.volunteerProfile.findUnique({
            where: { id: profileId },
            select: { id: true, userId: true, isVerified: true },
        });
    }
    async approveVolunteer(actorId, profileId, userId) {
        await this.prisma.$transaction(async (tx) => {
            await tx.volunteerProfile.update({
                where: { id: profileId },
                data: { isVerified: true },
            });
            await tx.user.update({
                where: { id: userId },
                data: { role: client_1.Role.VOLUNTEER },
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
    async rejectVolunteer(actorId, profileId, userId) {
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
    async getUsers(page, limit, search) {
        const where = search
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
    async findUserById(userId) {
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
    async updateUserStatus(actorId, targetUserId, status, action, description) {
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.user.update({
                where: { id: targetUserId },
                data: { status: status },
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
};
exports.AdminPrismaRepository = AdminPrismaRepository;
exports.AdminPrismaRepository = AdminPrismaRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminPrismaRepository);
//# sourceMappingURL=admin.prisma.repository.js.map