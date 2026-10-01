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
exports.SendMessageUseCase = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const chat_repository_interface_1 = require("../../domain/repositories/chat.repository.interface");
let SendMessageUseCase = class SendMessageUseCase {
    chatRepository;
    constructor(chatRepository) {
        this.chatRepository = chatRepository;
    }
    async execute(senderId, sessionId, content) {
        const session = await this.chatRepository.findSessionById(sessionId);
        if (!session) {
            throw new common_1.NotFoundException('Không tìm thấy phiên hỗ trợ');
        }
        if (session.status !== client_1.SessionStatus.ACTIVE) {
            throw new common_1.ForbiddenException('Phiên hỗ trợ chưa bắt đầu hoặc đã kết thúc');
        }
        if (session.userId !== senderId && session.volunteerId !== senderId) {
            throw new common_1.ForbiddenException('Bạn không thuộc phiên hỗ trợ này');
        }
        return this.chatRepository.createMessage({
            sessionId,
            senderId,
            content,
        });
    }
};
exports.SendMessageUseCase = SendMessageUseCase;
exports.SendMessageUseCase = SendMessageUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(chat_repository_interface_1.CHAT_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], SendMessageUseCase);
//# sourceMappingURL=send-message.use-case.js.map