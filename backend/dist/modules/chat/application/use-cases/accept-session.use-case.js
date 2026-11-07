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
exports.AcceptSessionUseCase = void 0;
const common_1 = require("@nestjs/common");
const chat_repository_interface_1 = require("../../domain/repositories/chat.repository.interface");
const create_notification_use_case_1 = require("../../../notification/application/use-cases/create-notification.use-case");
let AcceptSessionUseCase = class AcceptSessionUseCase {
    chatRepository;
    createNotificationUseCase;
    constructor(chatRepository, createNotificationUseCase) {
        this.chatRepository = chatRepository;
        this.createNotificationUseCase = createNotificationUseCase;
    }
    async execute(volunteerId, sessionId) {
        const isVerified = await this.chatRepository.isVolunteerVerified(volunteerId);
        if (!isVerified) {
            throw new common_1.ForbiddenException('Tài khoản tình nguyện viên chưa được duyệt hồ sơ xác thực');
        }
        const session = await this.chatRepository.findSessionById(sessionId);
        if (!session) {
            throw new common_1.NotFoundException('Không tìm thấy phiên hỗ trợ');
        }
        const acceptedSession = await this.chatRepository.acceptSession(sessionId, volunteerId);
        if (!acceptedSession) {
            throw new common_1.ConflictException('Phiên đã được nhận bởi người khác');
        }
        if (this.createNotificationUseCase) {
            await this.createNotificationUseCase.execute({
                userId: acceptedSession.userId,
                title: 'Tình nguyện viên đã tiếp nhận phiên hỗ trợ',
                content: 'Một tình nguyện viên vừa tiếp nhận yêu cầu hỗ trợ của bạn. Hãy vào phòng chat để bắt đầu.',
                type: 'SESSION_ACCEPTED',
            }).catch(() => null);
        }
        return acceptedSession;
    }
};
exports.AcceptSessionUseCase = AcceptSessionUseCase;
exports.AcceptSessionUseCase = AcceptSessionUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(chat_repository_interface_1.CHAT_REPOSITORY)),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [Object, create_notification_use_case_1.CreateNotificationUseCase])
], AcceptSessionUseCase);
//# sourceMappingURL=accept-session.use-case.js.map