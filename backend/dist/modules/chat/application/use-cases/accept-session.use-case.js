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
let AcceptSessionUseCase = class AcceptSessionUseCase {
    chatRepository;
    constructor(chatRepository) {
        this.chatRepository = chatRepository;
    }
    async execute(volunteerId, sessionId) {
        const session = await this.chatRepository.findSessionById(sessionId);
        if (!session) {
            throw new common_1.NotFoundException('Không tìm thấy phiên hỗ trợ');
        }
        const acceptedSession = await this.chatRepository.acceptSession(sessionId, volunteerId);
        if (!acceptedSession) {
            throw new common_1.ConflictException('Phiên đã được nhận bởi người khác');
        }
        return acceptedSession;
    }
};
exports.AcceptSessionUseCase = AcceptSessionUseCase;
exports.AcceptSessionUseCase = AcceptSessionUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(chat_repository_interface_1.CHAT_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], AcceptSessionUseCase);
//# sourceMappingURL=accept-session.use-case.js.map