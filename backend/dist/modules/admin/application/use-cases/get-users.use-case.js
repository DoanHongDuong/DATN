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
exports.GetUsersUseCase = void 0;
const common_1 = require("@nestjs/common");
const admin_repository_interface_1 = require("../../domain/repositories/admin.repository.interface");
let GetUsersUseCase = class GetUsersUseCase {
    adminRepo;
    constructor(adminRepo) {
        this.adminRepo = adminRepo;
    }
    async execute(query) {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = query.limit && query.limit > 0 ? query.limit : 10;
        return this.adminRepo.getUsers(page, limit, query.search?.trim());
    }
};
exports.GetUsersUseCase = GetUsersUseCase;
exports.GetUsersUseCase = GetUsersUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(admin_repository_interface_1.ADMIN_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], GetUsersUseCase);
//# sourceMappingURL=get-users.use-case.js.map