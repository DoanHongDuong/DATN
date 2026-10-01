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
exports.JournalPrismaRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../infrastructure/prisma/prisma.service");
let JournalPrismaRepository = class JournalPrismaRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.journalEntry.create({
            data: {
                userId: data.userId,
                content: data.content,
                moodEmoji: data.moodEmoji,
                sentimentLabel: data.sentimentLabel,
                sentimentScore: data.sentimentScore,
            },
        });
    }
    async findById(id) {
        return this.prisma.journalEntry.findUnique({
            where: { id },
        });
    }
    async findByUserId(userId, skip, take) {
        return this.prisma.journalEntry.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        });
    }
    async countByUserId(userId) {
        return this.prisma.journalEntry.count({
            where: { userId },
        });
    }
    async update(id, data) {
        return this.prisma.journalEntry.update({
            where: { id },
            data: {
                content: data.content,
                moodEmoji: data.moodEmoji,
                sentimentLabel: data.sentimentLabel,
                sentimentScore: data.sentimentScore,
            },
        });
    }
    async delete(id) {
        await this.prisma.journalEntry.delete({
            where: { id },
        });
    }
    async findRelaxationResourcesByCategory(category) {
        return this.prisma.relaxationResource.findMany({
            where: { category },
        });
    }
    async findAllRelaxationResources() {
        return this.prisma.relaxationResource.findMany();
    }
};
exports.JournalPrismaRepository = JournalPrismaRepository;
exports.JournalPrismaRepository = JournalPrismaRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JournalPrismaRepository);
//# sourceMappingURL=journal.prisma.repository.js.map