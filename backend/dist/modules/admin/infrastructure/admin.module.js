"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("../../auth/infrastructure/auth.module");
const admin_controller_1 = require("../presentation/admin.controller");
const admin_prisma_repository_1 = require("./persistence/admin.prisma.repository");
const admin_repository_interface_1 = require("../domain/repositories/admin.repository.interface");
const get_pending_volunteers_use_case_1 = require("../application/use-cases/get-pending-volunteers.use-case");
const approve_volunteer_use_case_1 = require("../application/use-cases/approve-volunteer.use-case");
const reject_volunteer_use_case_1 = require("../application/use-cases/reject-volunteer.use-case");
const get_users_use_case_1 = require("../application/use-cases/get-users.use-case");
const update_user_status_use_case_1 = require("../application/use-cases/update-user-status.use-case");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, auth_module_1.AuthModule],
        controllers: [admin_controller_1.AdminController],
        providers: [
            {
                provide: admin_repository_interface_1.ADMIN_REPOSITORY,
                useClass: admin_prisma_repository_1.AdminPrismaRepository,
            },
            get_pending_volunteers_use_case_1.GetPendingVolunteersUseCase,
            approve_volunteer_use_case_1.ApproveVolunteerUseCase,
            reject_volunteer_use_case_1.RejectVolunteerUseCase,
            get_users_use_case_1.GetUsersUseCase,
            update_user_status_use_case_1.UpdateUserStatusUseCase,
        ],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map