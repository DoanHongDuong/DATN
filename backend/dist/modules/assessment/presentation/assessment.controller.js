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
exports.AssessmentController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../auth/presentation/guards/jwt-auth.guard");
const list_tests_use_case_1 = require("../application/use-cases/list-tests.use-case");
const get_test_questions_use_case_1 = require("../application/use-cases/get-test-questions.use-case");
const submit_test_use_case_1 = require("../application/use-cases/submit-test.use-case");
const get_test_history_use_case_1 = require("../application/use-cases/get-test-history.use-case");
const submit_test_dto_1 = require("../application/dto/submit-test.dto");
let AssessmentController = class AssessmentController {
    listTestsUseCase;
    getTestQuestionsUseCase;
    submitTestUseCase;
    getTestHistoryUseCase;
    constructor(listTestsUseCase, getTestQuestionsUseCase, submitTestUseCase, getTestHistoryUseCase) {
        this.listTestsUseCase = listTestsUseCase;
        this.getTestQuestionsUseCase = getTestQuestionsUseCase;
        this.submitTestUseCase = submitTestUseCase;
        this.getTestHistoryUseCase = getTestHistoryUseCase;
    }
    async listTests() {
        return this.listTestsUseCase.execute();
    }
    async getHistory(req, page, limit) {
        return this.getTestHistoryUseCase.execute(req.user.userId, page, limit);
    }
    async getQuestions(id) {
        return this.getTestQuestionsUseCase.execute(id);
    }
    async submitTest(req, id, dto) {
        return this.submitTestUseCase.execute(req.user.userId, id, dto);
    }
};
exports.AssessmentController = AssessmentController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "listTests", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(10), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)(':id/questions'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "getQuestions", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, submit_test_dto_1.SubmitTestDto]),
    __metadata("design:returntype", Promise)
], AssessmentController.prototype, "submitTest", null);
exports.AssessmentController = AssessmentController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('assessments'),
    __metadata("design:paramtypes", [list_tests_use_case_1.ListTestsUseCase,
        get_test_questions_use_case_1.GetTestQuestionsUseCase,
        submit_test_use_case_1.SubmitTestUseCase,
        get_test_history_use_case_1.GetTestHistoryUseCase])
], AssessmentController);
//# sourceMappingURL=assessment.controller.js.map