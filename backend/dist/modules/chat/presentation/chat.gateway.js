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
var ChatGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const send_message_use_case_1 = require("../application/use-cases/send-message.use-case");
const end_session_use_case_1 = require("../application/use-cases/end-session.use-case");
const common_2 = require("@nestjs/common");
const chat_repository_interface_1 = require("../domain/repositories/chat.repository.interface");
let ChatGateway = ChatGateway_1 = class ChatGateway {
    jwtService;
    configService;
    sendMessageUseCase;
    endSessionUseCase;
    chatRepository;
    server;
    logger = new common_1.Logger(ChatGateway_1.name);
    constructor(jwtService, configService, sendMessageUseCase, endSessionUseCase, chatRepository) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.sendMessageUseCase = sendMessageUseCase;
        this.endSessionUseCase = endSessionUseCase;
        this.chatRepository = chatRepository;
    }
    afterInit(server) {
        const frontendUrl = this.configService.get('FRONTEND_URL');
        server.engine.opts.cors = {
            origin: frontendUrl,
            credentials: true,
        };
        const cors = require('cors');
        server.engine.use(cors({
            origin: frontendUrl,
            credentials: true,
        }));
    }
    async handleConnection(client) {
        try {
            const token = this.extractToken(client);
            if (!token) {
                this.logger.warn('Socket connection rejected: no token provided');
                client.disconnect();
                return;
            }
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('JWT_SECRET'),
            });
            client.data.userId = payload.sub;
            client.data.role = payload.role;
            await client.join(`user:${payload.sub}`);
            this.logger.log(`Socket connected: userId=${payload.sub}`);
        }
        catch {
            this.logger.warn('Socket connection rejected: invalid token');
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        if (client.data?.userId) {
            this.logger.log(`Socket disconnected: userId=${client.data.userId}`);
        }
    }
    async handleJoinSession(client, data) {
        if (!data?.sessionId) {
            return { success: false, error: 'Thiếu sessionId' };
        }
        const session = await this.chatRepository.findSessionById(data.sessionId);
        if (!session) {
            return { success: false, error: 'Không tìm thấy phiên hỗ trợ' };
        }
        const userId = client.data.userId;
        if (session.userId !== userId && session.volunteerId !== userId) {
            return { success: false, error: 'Bạn không thuộc phiên hỗ trợ này' };
        }
        await client.join(`session:${data.sessionId}`);
        this.logger.log(`User ${userId} joined session room: session:${data.sessionId}`);
        return { success: true };
    }
    async handleSendMessage(client, data) {
        if (!data?.sessionId || !data?.content) {
            return { success: false, error: 'Thiếu sessionId hoặc content' };
        }
        try {
            const message = await this.sendMessageUseCase.execute(client.data.userId, data.sessionId, data.content);
            this.server
                .to(`session:${data.sessionId}`)
                .emit('new_message', message);
            return { success: true };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Không thể gửi tin nhắn';
            return { success: false, error: errorMessage };
        }
    }
    async handleEndSession(client, data) {
        if (!data?.sessionId) {
            return { success: false, error: 'Thiếu sessionId' };
        }
        try {
            const closedSession = await this.endSessionUseCase.execute(client.data.userId, data.sessionId);
            this.server
                .to(`session:${data.sessionId}`)
                .emit('session_ended', closedSession);
            return { success: true };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Không thể kết thúc phiên';
            return { success: false, error: errorMessage };
        }
    }
    emitSessionAccepted(userId, session) {
        this.server.to(`user:${userId}`).emit('session_accepted', session);
    }
    extractToken(client) {
        const authToken = client.handshake.auth?.token;
        if (typeof authToken === 'string' && authToken.length > 0) {
            return authToken;
        }
        const authHeader = client.handshake.headers?.authorization;
        if (typeof authHeader === 'string' && authHeader.length > 0) {
            const [type, token] = authHeader.split(' ');
            return type === 'Bearer' && token ? token : authHeader;
        }
        const queryToken = client.handshake.query?.token;
        if (typeof queryToken === 'string' && queryToken.length > 0) {
            return queryToken;
        }
        return undefined;
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_session'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinSession", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('end_session'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleEndSession", null);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)(),
    __param(4, (0, common_2.Inject)(chat_repository_interface_1.CHAT_REPOSITORY)),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        send_message_use_case_1.SendMessageUseCase,
        end_session_use_case_1.EndSessionUseCase, Object])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map