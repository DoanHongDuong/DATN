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
exports.ApplyVolunteerUseCase = void 0;
const common_1 = require("@nestjs/common");
const volunteer_repository_interface_1 = require("../../domain/repositories/volunteer.repository.interface");
let ApplyVolunteerUseCase = class ApplyVolunteerUseCase {
    volunteerRepo;
    constructor(volunteerRepo) {
        this.volunteerRepo = volunteerRepo;
    }
    async execute(userId, dto) {
        const existing = await this.volunteerRepo.findByUserId(userId);
        if (existing) {
            throw new common_1.ConflictException('Bạn đã gửi hồ sơ đăng ký tình nguyện viên trước đó');
        }
        return this.volunteerRepo.create({
            userId,
            specialization: dto.specialization,
            bio: dto.bio,
            certificateUrl: dto.certificateUrl,
        });
    }
};
exports.ApplyVolunteerUseCase = ApplyVolunteerUseCase;
exports.ApplyVolunteerUseCase = ApplyVolunteerUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(volunteer_repository_interface_1.VOLUNTEER_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], ApplyVolunteerUseCase);
//# sourceMappingURL=apply-volunteer.use-case.js.map