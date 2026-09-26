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
exports.AssessmentPrismaRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../modules/auth/infrastructure/prisma/prisma.service");
let AssessmentPrismaRepository = class AssessmentPrismaRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findTests() {
        return this.prisma.psychologicalTest.findMany({
            orderBy: { code: 'asc' },
        });
    }
    async findTestById(testId) {
        return this.prisma.psychologicalTest.findUnique({
            where: { id: testId },
        });
    }
    async findQuestionsByTestId(testId) {
        return this.prisma.testQuestion.findMany({
            where: { testId },
            include: {
                options: true,
            },
            orderBy: {
                orderNumber: 'asc',
            },
        });
    }
    async saveTestResult(data) {
        return this.prisma.$transaction(async (prisma) => {
            const result = await prisma.testResult.create({
                data: {
                    userId: data.userId,
                    testId: data.testId,
                    totalScore: data.totalScore,
                    severityLevel: data.severityLevel,
                },
            });
            const answersData = data.answers.map(ans => ({
                resultId: result.id,
                questionId: ans.questionId,
                optionId: ans.optionId,
            }));
            await prisma.testAnswer.createMany({
                data: answersData,
            });
            return result;
        });
    }
    async findTestHistoryByUserId(userId, skip, take) {
        return this.prisma.testResult.findMany({
            where: { userId },
            include: {
                test: {
                    select: { name: true, code: true }
                }
            },
            orderBy: { takenAt: 'desc' },
            skip,
            take,
        });
    }
    async countTestHistoryByUserId(userId) {
        return this.prisma.testResult.count({
            where: { userId },
        });
    }
};
exports.AssessmentPrismaRepository = AssessmentPrismaRepository;
exports.AssessmentPrismaRepository = AssessmentPrismaRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AssessmentPrismaRepository);
//# sourceMappingURL=assessment.prisma.repository.js.map