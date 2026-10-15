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
exports.VolunteerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../auth/presentation/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/presentation/guards/roles.guard");
const roles_decorator_1 = require("../../auth/presentation/decorators/roles.decorator");
const apply_volunteer_use_case_1 = require("../application/use-cases/apply-volunteer.use-case");
const get_my_volunteer_profile_use_case_1 = require("../application/use-cases/get-my-volunteer-profile.use-case");
const update_volunteer_online_use_case_1 = require("../application/use-cases/update-volunteer-online.use-case");
const apply_volunteer_dto_1 = require("../application/dto/apply-volunteer.dto");
const update_online_status_dto_1 = require("../application/dto/update-online-status.dto");
let VolunteerController = class VolunteerController {
    applyVolunteerUseCase;
    getMyVolunteerProfileUseCase;
    updateVolunteerOnlineUseCase;
    constructor(applyVolunteerUseCase, getMyVolunteerProfileUseCase, updateVolunteerOnlineUseCase) {
        this.applyVolunteerUseCase = applyVolunteerUseCase;
        this.getMyVolunteerProfileUseCase = getMyVolunteerProfileUseCase;
        this.updateVolunteerOnlineUseCase = updateVolunteerOnlineUseCase;
    }
    async apply(req, dto) {
        return this.applyVolunteerUseCase.execute(req.user.userId, dto);
    }
    async getMyProfile(req) {
        return this.getMyVolunteerProfileUseCase.execute(req.user.userId);
    }
    async updateOnline(req, dto) {
        return this.updateVolunteerOnlineUseCase.execute(req.user.userId, dto.isOnline);
    }
};
exports.VolunteerController = VolunteerController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Nộp hồ sơ đăng ký làm tình nguyện viên' }),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.USER),
    (0, common_1.Post)('apply'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, apply_volunteer_dto_1.ApplyVolunteerDto]),
    __metadata("design:returntype", Promise)
], VolunteerController.prototype, "apply", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Lấy hồ sơ tình nguyện viên của chính mình' }),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VolunteerController.prototype, "getMyProfile", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật trạng thái trực tuyến của tình nguyện viên' }),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.VOLUNTEER),
    (0, common_1.Patch)('me/online'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_online_status_dto_1.UpdateOnlineStatusDto]),
    __metadata("design:returntype", Promise)
], VolunteerController.prototype, "updateOnline", null);
exports.VolunteerController = VolunteerController = __decorate([
    (0, swagger_1.ApiTags)('Volunteers'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('volunteers'),
    __metadata("design:paramtypes", [apply_volunteer_use_case_1.ApplyVolunteerUseCase,
        get_my_volunteer_profile_use_case_1.GetMyVolunteerProfileUseCase,
        update_volunteer_online_use_case_1.UpdateVolunteerOnlineUseCase])
], VolunteerController);
//# sourceMappingURL=volunteer.controller.js.map