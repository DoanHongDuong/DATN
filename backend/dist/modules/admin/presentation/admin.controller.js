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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const jwt_auth_guard_1 = require("../../auth/presentation/guards/jwt-auth.guard");
const roles_guard_1 = require("../../auth/presentation/guards/roles.guard");
const roles_decorator_1 = require("../../auth/presentation/decorators/roles.decorator");
const get_pending_volunteers_use_case_1 = require("../application/use-cases/get-pending-volunteers.use-case");
const approve_volunteer_use_case_1 = require("../application/use-cases/approve-volunteer.use-case");
const reject_volunteer_use_case_1 = require("../application/use-cases/reject-volunteer.use-case");
const get_users_use_case_1 = require("../application/use-cases/get-users.use-case");
const update_user_status_use_case_1 = require("../application/use-cases/update-user-status.use-case");
const update_user_status_dto_1 = require("../application/dto/update-user-status.dto");
const get_users_query_dto_1 = require("../application/dto/get-users-query.dto");
let AdminController = class AdminController {
    getPendingVolunteersUseCase;
    approveVolunteerUseCase;
    rejectVolunteerUseCase;
    getUsersUseCase;
    updateUserStatusUseCase;
    constructor(getPendingVolunteersUseCase, approveVolunteerUseCase, rejectVolunteerUseCase, getUsersUseCase, updateUserStatusUseCase) {
        this.getPendingVolunteersUseCase = getPendingVolunteersUseCase;
        this.approveVolunteerUseCase = approveVolunteerUseCase;
        this.rejectVolunteerUseCase = rejectVolunteerUseCase;
        this.getUsersUseCase = getUsersUseCase;
        this.updateUserStatusUseCase = updateUserStatusUseCase;
    }
    async getPendingVolunteers() {
        return this.getPendingVolunteersUseCase.execute();
    }
    async approveVolunteer(req, profileId) {
        return this.approveVolunteerUseCase.execute(req.user.userId, profileId);
    }
    async rejectVolunteer(req, profileId) {
        return this.rejectVolunteerUseCase.execute(req.user.userId, profileId);
    }
    async getUsers(query) {
        return this.getUsersUseCase.execute(query);
    }
    async updateUserStatus(req, id, dto) {
        return this.updateUserStatusUseCase.execute(req.user.userId, id, dto.status);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách hồ sơ tình nguyện viên đang chờ duyệt' }),
    (0, common_1.Get)('volunteers/pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingVolunteers", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Phê duyệt hồ sơ tình nguyện viên' }),
    (0, common_1.Post)('volunteers/:profileId/approve'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('profileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveVolunteer", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Từ chối và xoá hồ sơ tình nguyện viên' }),
    (0, common_1.Post)('volunteers/:profileId/reject'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('profileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectVolunteer", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách người dùng có phân trang và tìm kiếm' }),
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_users_query_dto_1.GetUsersQueryDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật trạng thái người dùng (ACTIVE / SUSPENDED)' }),
    (0, common_1.Patch)('users/:id/status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_user_status_dto_1.UpdateUserStatusDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserStatus", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [get_pending_volunteers_use_case_1.GetPendingVolunteersUseCase,
        approve_volunteer_use_case_1.ApproveVolunteerUseCase,
        reject_volunteer_use_case_1.RejectVolunteerUseCase,
        get_users_use_case_1.GetUsersUseCase,
        update_user_status_use_case_1.UpdateUserStatusUseCase])
], AdminController);
//# sourceMappingURL=admin.controller.js.map