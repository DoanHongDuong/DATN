"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const chat_controller_1 = require("../presentation/chat.controller");
const chat_gateway_1 = require("../presentation/chat.gateway");
const request_support_use_case_1 = require("../application/use-cases/request-support.use-case");
const accept_session_use_case_1 = require("../application/use-cases/accept-session.use-case");
const send_message_use_case_1 = require("../application/use-cases/send-message.use-case");
const end_session_use_case_1 = require("../application/use-cases/end-session.use-case");
const get_queue_position_use_case_1 = require("../application/use-cases/get-queue-position.use-case");
const chat_prisma_repository_1 = require("./persistence/chat.prisma.repository");
const chat_repository_interface_1 = require("../domain/repositories/chat.repository.interface");
const auth_module_1 = require("../../auth/infrastructure/auth.module");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            auth_module_1.AuthModule,
        ],
        controllers: [chat_controller_1.ChatController],
        providers: [
            {
                provide: chat_repository_interface_1.CHAT_REPOSITORY,
                useClass: chat_prisma_repository_1.ChatPrismaRepository,
            },
            request_support_use_case_1.RequestSupportUseCase,
            accept_session_use_case_1.AcceptSessionUseCase,
            send_message_use_case_1.SendMessageUseCase,
            end_session_use_case_1.EndSessionUseCase,
            get_queue_position_use_case_1.GetQueuePositionUseCase,
            chat_gateway_1.ChatGateway,
        ],
        exports: [chat_gateway_1.ChatGateway],
    })
], ChatModule);
//# sourceMappingURL=chat.module.js.map