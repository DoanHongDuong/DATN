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
const get_admin_resources_use_case_1 = require("../application/use-cases/get-admin-resources.use-case");
const create_resource_use_case_1 = require("../application/use-cases/create-resource.use-case");
const update_resource_use_case_1 = require("../application/use-cases/update-resource.use-case");
const delete_resource_use_case_1 = require("../application/use-cases/delete-resource.use-case");
const create_resource_dto_1 = require("../application/dto/create-resource.dto");
const update_resource_dto_1 = require("../application/dto/update-resource.dto");
const get_audit_logs_use_case_1 = require("../application/use-cases/get-audit-logs.use-case");
const get_audit_logs_query_dto_1 = require("../application/dto/get-audit-logs-query.dto");
let AdminController = class AdminController {
    getPendingVolunteersUseCase;
    approveVolunteerUseCase;
    rejectVolunteerUseCase;
    getUsersUseCase;
    updateUserStatusUseCase;
    getAdminResourcesUseCase;
    createResourceUseCase;
    updateResourceUseCase;
    deleteResourceUseCase;
    getAuditLogsUseCase;
    constructor(getPendingVolunteersUseCase, approveVolunteerUseCase, rejectVolunteerUseCase, getUsersUseCase, updateUserStatusUseCase, getAdminResourcesUseCase, createResourceUseCase, updateResourceUseCase, deleteResourceUseCase, getAuditLogsUseCase) {
        this.getPendingVolunteersUseCase = getPendingVolunteersUseCase;
        this.approveVolunteerUseCase = approveVolunteerUseCase;
        this.rejectVolunteerUseCase = rejectVolunteerUseCase;
        this.getUsersUseCase = getUsersUseCase;
        this.updateUserStatusUseCase = updateUserStatusUseCase;
        this.getAdminResourcesUseCase = getAdminResourcesUseCase;
        this.createResourceUseCase = createResourceUseCase;
        this.updateResourceUseCase = updateResourceUseCase;
        this.deleteResourceUseCase = deleteResourceUseCase;
        this.getAuditLogsUseCase = getAuditLogsUseCase;
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
    async getResources(category) {
        return this.getAdminResourcesUseCase.execute(category);
    }
    async createResource(req, dto) {
        return this.createResourceUseCase.execute(req.user.userId, dto);
    }
    async updateResource(req, id, dto) {
        return this.updateResourceUseCase.execute(req.user.userId, id, dto);
    }
    async deleteResource(req, id) {
        return this.deleteResourceUseCase.execute(req.user.userId, id);
    }
    async getAuditLogs(query) {
        return this.getAuditLogsUseCase.execute(query);
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
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách toàn bộ tài nguyên thư giãn cho Admin' }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false, description: 'Lọc theo danh mục' }),
    (0, common_1.Get)('resources'),
    __param(0, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getResources", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Thêm tài nguyên thư giãn mới' }),
    (0, common_1.Post)('resources'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_resource_dto_1.CreateResourceDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createResource", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Cập nhật tài nguyên thư giãn' }),
    (0, common_1.Put)('resources/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_resource_dto_1.UpdateResourceDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateResource", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Xoá tài nguyên thư giãn' }),
    (0, common_1.Delete)('resources/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteResource", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách nhật ký kiểm toán (Audit Logs) có phân trang và lọc' }),
    (0, common_1.Get)('audit-logs'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_audit_logs_query_dto_1.GetAuditLogsQueryDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAuditLogs", null);
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
        update_user_status_use_case_1.UpdateUserStatusUseCase,
        get_admin_resources_use_case_1.GetAdminResourcesUseCase,
        create_resource_use_case_1.CreateResourceUseCase,
        update_resource_use_case_1.UpdateResourceUseCase,
        delete_resource_use_case_1.DeleteResourceUseCase,
        get_audit_logs_use_case_1.GetAuditLogsUseCase])
], AdminController);
//# sourceMappingURL=admin.controller.js.map