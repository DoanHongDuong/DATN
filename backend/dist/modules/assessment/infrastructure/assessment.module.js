"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const assessment_controller_1 = require("../presentation/assessment.controller");
const assessment_prisma_repository_1 = require("./persistence/assessment.prisma.repository");
const list_tests_use_case_1 = require("../application/use-cases/list-tests.use-case");
const get_test_questions_use_case_1 = require("../application/use-cases/get-test-questions.use-case");
const submit_test_use_case_1 = require("../application/use-cases/submit-test.use-case");
const get_test_history_use_case_1 = require("../application/use-cases/get-test-history.use-case");
const auth_module_1 = require("../../auth/infrastructure/auth.module");
let AssessmentModule = class AssessmentModule {
};
exports.AssessmentModule = AssessmentModule;
exports.AssessmentModule = AssessmentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            config_1.ConfigModule,
        ],
        controllers: [assessment_controller_1.AssessmentController],
        providers: [
            {
                provide: 'IAssessmentRepository',
                useClass: assessment_prisma_repository_1.AssessmentPrismaRepository,
            },
            list_tests_use_case_1.ListTestsUseCase,
            get_test_questions_use_case_1.GetTestQuestionsUseCase,
            submit_test_use_case_1.SubmitTestUseCase,
            get_test_history_use_case_1.GetTestHistoryUseCase,
        ],
    })
], AssessmentModule);
//# sourceMappingURL=assessment.module.js.map