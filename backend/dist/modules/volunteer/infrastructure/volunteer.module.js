"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VolunteerModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("../../auth/infrastructure/auth.module");
const volunteer_controller_1 = require("../presentation/volunteer.controller");
const volunteer_prisma_repository_1 = require("./persistence/volunteer.prisma.repository");
const volunteer_repository_interface_1 = require("../domain/repositories/volunteer.repository.interface");
const apply_volunteer_use_case_1 = require("../application/use-cases/apply-volunteer.use-case");
const get_my_volunteer_profile_use_case_1 = require("../application/use-cases/get-my-volunteer-profile.use-case");
const update_volunteer_online_use_case_1 = require("../application/use-cases/update-volunteer-online.use-case");
let VolunteerModule = class VolunteerModule {
};
exports.VolunteerModule = VolunteerModule;
exports.VolunteerModule = VolunteerModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, auth_module_1.AuthModule],
        controllers: [volunteer_controller_1.VolunteerController],
        providers: [
            {
                provide: volunteer_repository_interface_1.VOLUNTEER_REPOSITORY,
                useClass: volunteer_prisma_repository_1.VolunteerPrismaRepository,
            },
            apply_volunteer_use_case_1.ApplyVolunteerUseCase,
            get_my_volunteer_profile_use_case_1.GetMyVolunteerProfileUseCase,
            update_volunteer_online_use_case_1.UpdateVolunteerOnlineUseCase,
        ],
        exports: [get_my_volunteer_profile_use_case_1.GetMyVolunteerProfileUseCase],
    })
], VolunteerModule);
//# sourceMappingURL=volunteer.module.js.map