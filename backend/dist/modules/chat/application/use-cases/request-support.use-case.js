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
exports.RequestSupportUseCase = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const chat_repository_interface_1 = require("../../domain/repositories/chat.repository.interface");
const priority_mapping_constant_1 = require("../../infrastructure/constants/priority-mapping.constant");
let RequestSupportUseCase = class RequestSupportUseCase {
    chatRepository;
    configService;
    constructor(chatRepository, configService) {
        this.chatRepository = chatRepository;
        this.configService = configService;
    }
    async execute(userId) {
        const existingSession = await this.chatRepository.findActiveOrWaitingSessionByUserId(userId);
        if (existingSession) {
            throw new common_1.ConflictException('Bạn đang có một phiên hỗ trợ chưa kết thúc. Vui lòng đợi hoặc kết thúc phiên hiện tại.');
        }
        const hasVolunteer = await this.chatRepository.hasAvailableVolunteer();
        if (!hasVolunteer) {
            return {
                noVolunteerAvailable: true,
                hotline: this.configService.get('EMERGENCY_HOTLINE'),
            };
        }
        const latestSeverity = await this.chatRepository.findLatestSeverityByUserId(userId);
        const priorityLevel = latestSeverity
            ? priority_mapping_constant_1.SEVERITY_TO_PRIORITY_MAP[latestSeverity]
            : priority_mapping_constant_1.DEFAULT_PRIORITY_LEVEL;
        const session = await this.chatRepository.createSession({
            userId,
            priorityLevel,
            status: client_1.SessionStatus.WAITING,
        });
        return {
            noVolunteerAvailable: false,
            session,
        };
    }
};
exports.RequestSupportUseCase = RequestSupportUseCase;
exports.RequestSupportUseCase = RequestSupportUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(chat_repository_interface_1.CHAT_REPOSITORY)),
    __metadata("design:paramtypes", [Object, config_1.ConfigService])
], RequestSupportUseCase);
//# sourceMappingURL=request-support.use-case.js.map