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
const create_notification_use_case_1 = require("../../../notification/application/use-cases/create-notification.use-case");
let RequestSupportUseCase = class RequestSupportUseCase {
    chatRepository;
    configService;
    createNotificationUseCase;
    constructor(chatRepository, configService, createNotificationUseCase) {
        this.chatRepository = chatRepository;
        this.configService = configService;
        this.createNotificationUseCase = createNotificationUseCase;
    }
    async execute(userId) {
        const existingSession = await this.chatRepository.findActiveOrWaitingSessionByUserId(userId);
        if (existingSession) {
            throw new common_1.ConflictException('Bạn đang có một phiên hỗ trợ chưa kết thúc. Vui lòng đợi hoặc kết thúc phiên hiện tại.');
        }
        const hasVolunteer = await this.chatRepository.hasAvailableVolunteer();
        if (!hasVolunteer) {
            const rawHotline = this.configService.get('EMERGENCY_HOTLINE')?.replace(/^["']|["']$/g, '').trim();
            const hotline = (rawHotline && rawHotline !== '1900 6789') ? rawHotline : '0979877220';
            return {
                noVolunteerAvailable: true,
                hotline,
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
        if (this.createNotificationUseCase) {
            const volunteerUserIds = await this.chatRepository.findAvailableVolunteerUserIds();
            const targetVolunteerIds = volunteerUserIds.filter((vId) => vId !== userId);
            await Promise.allSettled(targetVolunteerIds.map((vId) => this.createNotificationUseCase.execute({
                userId: vId,
                title: 'Có sinh viên vào hàng đợi tư vấn',
                content: `Một sinh viên vừa gửi yêu cầu hỗ trợ với mức ưu tiên: ${priorityLevel}. Hãy tiếp nhận phiên ngay.`,
                type: 'NEW_WAITING_SESSION',
            })));
        }
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
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [Object, config_1.ConfigService,
        create_notification_use_case_1.CreateNotificationUseCase])
], RequestSupportUseCase);
//# sourceMappingURL=request-support.use-case.js.map