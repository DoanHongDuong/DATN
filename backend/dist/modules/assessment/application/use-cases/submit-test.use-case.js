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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitTestUseCase = void 0;
const common_1 = require("@nestjs/common");
const severity_thresholds_constant_1 = require("../../infrastructure/constants/severity-thresholds.constant");
let SubmitTestUseCase = class SubmitTestUseCase {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async execute(userId, testId, dto) {
        const test = await this.repository.findTestById(testId);
        if (!test) {
            throw new common_1.NotFoundException('Test not found');
        }
        const testQuestions = await this.repository.findQuestionsByTestId(testId);
        if (dto.answers.length !== testQuestions.length) {
            throw new common_1.BadRequestException('Answers count does not match questions count');
        }
        let totalScore = 0;
        const answeredQuestionIds = new Set();
        for (const answer of dto.answers) {
            if (answeredQuestionIds.has(answer.questionId)) {
                throw new common_1.BadRequestException(`Duplicate answer for question ${answer.questionId}`);
            }
            answeredQuestionIds.add(answer.questionId);
            const question = testQuestions.find(q => q.id === answer.questionId);
            if (!question) {
                throw new common_1.BadRequestException(`Question ${answer.questionId} does not belong to this test`);
            }
            const option = question.options.find(o => o.id === answer.optionId);
            if (!option) {
                throw new common_1.BadRequestException(`Option ${answer.optionId} does not belong to question ${answer.questionId}`);
            }
            totalScore += option.scoreValue;
        }
        const severityLevel = (0, severity_thresholds_constant_1.getSeverityLevel)(test.code, totalScore);
        const result = await this.repository.saveTestResult({
            userId,
            testId,
            totalScore,
            severityLevel,
            answers: dto.answers,
        });
        return {
            result,
            severityLevel,
        };
    }
};
exports.SubmitTestUseCase = SubmitTestUseCase;
exports.SubmitTestUseCase = SubmitTestUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IAssessmentRepository')),
    __metadata("design:paramtypes", [Object])
], SubmitTestUseCase);
//# sourceMappingURL=submit-test.use-case.js.map