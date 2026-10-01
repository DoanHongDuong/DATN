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
exports.ChatPrismaRepository = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
let ChatPrismaRepository = class ChatPrismaRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findActiveOrWaitingSessionByUserId(userId) {
        return this.prisma.chatSession.findFirst({
            where: {
                userId,
                status: { in: [client_1.SessionStatus.WAITING, client_1.SessionStatus.ACTIVE] },
            },
        });
    }
    async findLatestSeverityByUserId(userId) {
        const result = await this.prisma.testResult.findFirst({
            where: { userId },
            orderBy: { takenAt: 'desc' },
            select: { severityLevel: true },
        });
        return result?.severityLevel ?? null;
    }
    async hasAvailableVolunteer() {
        const count = await this.prisma.volunteerProfile.count({
            where: {
                isOnline: true,
                isVerified: true,
            },
        });
        return count > 0;
    }
    async createSession(data) {
        return this.prisma.chatSession.create({
            data: {
                userId: data.userId,
                priorityLevel: data.priorityLevel,
                status: data.status,
            },
        });
    }
    async findSessionById(sessionId) {
        if (!sessionId) {
            return null;
        }
        return this.prisma.chatSession.findUnique({
            where: { id: sessionId },
        });
    }
    async acceptSession(sessionId, volunteerId) {
        return this.prisma.$transaction(async (tx) => {
            const session = await tx.chatSession.findUnique({
                where: { id: sessionId },
            });
            if (!session ||
                session.status !== client_1.SessionStatus.WAITING ||
                session.volunteerId !== null) {
                return null;
            }
            return tx.chatSession.update({
                where: { id: sessionId },
                data: {
                    status: client_1.SessionStatus.ACTIVE,
                    volunteerId,
                    startedAt: new Date(),
                },
            });
        });
    }
    async closeSession(sessionId) {
        return this.prisma.chatSession.update({
            where: { id: sessionId },
            data: {
                status: client_1.SessionStatus.CLOSED,
                endedAt: new Date(),
            },
        });
    }
    async createMessage(data) {
        return this.prisma.chatMessage.create({
            data: {
                sessionId: data.sessionId,
                senderId: data.senderId,
                content: data.content,
            },
        });
    }
    async findMessagesBySessionId(sessionId) {
        if (!sessionId) {
            return [];
        }
        return this.prisma.chatMessage.findMany({
            where: { sessionId },
            orderBy: { sentAt: 'asc' },
        });
    }
    async getQueuePosition(sessionId) {
        if (!sessionId) {
            return 0;
        }
        const session = await this.prisma.chatSession.findUnique({
            where: { id: sessionId },
        });
        if (!session || session.status !== client_1.SessionStatus.WAITING) {
            return 0;
        }
        const PRIORITY_ORDER = {
            [client_1.PriorityLevel.CRITICAL]: 4,
            [client_1.PriorityLevel.HIGH]: 3,
            [client_1.PriorityLevel.MEDIUM]: 2,
            [client_1.PriorityLevel.LOW]: 1,
        };
        const currentPriorityValue = PRIORITY_ORDER[session.priorityLevel];
        const waitingSessions = await this.prisma.chatSession.findMany({
            where: {
                status: client_1.SessionStatus.WAITING,
                id: { not: sessionId },
            },
            select: { priorityLevel: true, queuedAt: true },
        });
        let position = 1;
        for (const s of waitingSessions) {
            const sPriorityValue = PRIORITY_ORDER[s.priorityLevel];
            if (sPriorityValue > currentPriorityValue ||
                (sPriorityValue === currentPriorityValue &&
                    s.queuedAt < session.queuedAt)) {
                position++;
            }
        }
        return position;
    }
};
exports.ChatPrismaRepository = ChatPrismaRepository;
exports.ChatPrismaRepository = ChatPrismaRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatPrismaRepository);
//# sourceMappingURL=chat.prisma.repository.js.map