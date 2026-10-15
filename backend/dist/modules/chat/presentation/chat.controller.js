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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../auth/presentation/guards/jwt-auth.guard");
const request_support_use_case_1 = require("../application/use-cases/request-support.use-case");
const accept_session_use_case_1 = require("../application/use-cases/accept-session.use-case");
const get_queue_position_use_case_1 = require("../application/use-cases/get-queue-position.use-case");
const chat_repository_interface_1 = require("../domain/repositories/chat.repository.interface");
const chat_gateway_1 = require("./chat.gateway");
const client_1 = require("@prisma/client");
let ChatController = class ChatController {
    requestSupportUseCase;
    acceptSessionUseCase;
    getQueuePositionUseCase;
    chatRepository;
    chatGateway;
    constructor(requestSupportUseCase, acceptSessionUseCase, getQueuePositionUseCase, chatRepository, chatGateway) {
        this.requestSupportUseCase = requestSupportUseCase;
        this.acceptSessionUseCase = acceptSessionUseCase;
        this.getQueuePositionUseCase = getQueuePositionUseCase;
        this.chatRepository = chatRepository;
        this.chatGateway = chatGateway;
    }
    async requestSupport(req) {
        return this.requestSupportUseCase.execute(req.user.userId);
    }
    async acceptSession(sessionId, req) {
        if (req.user.role !== client_1.Role.VOLUNTEER) {
            throw new common_1.ForbiddenException('Chỉ tình nguyện viên mới có thể nhận phiên');
        }
        const session = await this.acceptSessionUseCase.execute(req.user.userId, sessionId);
        this.chatGateway.emitSessionAccepted(session.userId, session);
        return session;
    }
    async getQueuePosition(sessionId, req) {
        return this.getQueuePositionUseCase.execute(req.user.userId, sessionId);
    }
    async getMessages(sessionId, req) {
        const session = await this.chatRepository.findSessionById(sessionId);
        if (!session) {
            throw new common_1.ForbiddenException('Không tìm thấy phiên hỗ trợ');
        }
        if (session.userId !== req.user.userId &&
            session.volunteerId !== req.user.userId) {
            throw new common_1.ForbiddenException('Bạn không có quyền xem tin nhắn của phiên này');
        }
        return this.chatRepository.findMessagesBySessionId(sessionId);
    }
    async getWaitingSessions(req) {
        if (req.user.role !== client_1.Role.VOLUNTEER && req.user.role !== client_1.Role.ADMIN) {
            throw new common_1.ForbiddenException('Chỉ tình nguyện viên mới có thể xem danh sách hàng đợi');
        }
        return this.chatRepository.findWaitingSessions();
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Yêu cầu tư vấn hỗ trợ tâm lý' }),
    (0, common_1.Post)('request-support'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "requestSupport", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Tình nguyện viên chấp nhận phiên hỗ trợ' }),
    (0, common_1.Post)(':id/accept'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "acceptSession", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Lấy vị trí của phiên chat trong hàng đợi' }),
    (0, common_1.Get)(':id/queue-position'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getQueuePosition", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Lấy lịch sử tin nhắn của phiên chat' }),
    (0, common_1.Get)(':id/messages'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getMessages", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Lấy danh sách các phiên đang chờ TNV nhận' }),
    (0, common_1.Get)('waiting-sessions'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getWaitingSessions", null);
exports.ChatController = ChatController = __decorate([
    (0, swagger_1.ApiTags)('Chat'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('chat'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(3, (0, common_1.Inject)(chat_repository_interface_1.CHAT_REPOSITORY)),
    __metadata("design:paramtypes", [request_support_use_case_1.RequestSupportUseCase,
        accept_session_use_case_1.AcceptSessionUseCase,
        get_queue_position_use_case_1.GetQueuePositionUseCase, Object, chat_gateway_1.ChatGateway])
], ChatController);
//# sourceMappingURL=chat.controller.js.map