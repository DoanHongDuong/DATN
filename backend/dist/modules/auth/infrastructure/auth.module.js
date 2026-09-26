"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const auth_controller_1 = require("../presentation/auth.controller");
const register_user_use_case_1 = require("../application/use-cases/register-user.use-case");
const login_user_use_case_1 = require("../application/use-cases/login-user.use-case");
const request_password_reset_use_case_1 = require("../application/use-cases/request-password-reset.use-case");
const user_prisma_repository_1 = require("./persistence/user.prisma.repository");
const prisma_service_1 = require("./prisma/prisma.service");
const user_repository_interface_1 = require("../domain/repositories/user.repository.interface");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 900000,
                    limit: 5,
                }]),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.get('JWT_SECRET'),
                    signOptions: { expiresIn: '7d' },
                }),
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            prisma_service_1.PrismaService,
            {
                provide: user_repository_interface_1.USER_REPOSITORY,
                useClass: user_prisma_repository_1.UserPrismaRepository,
            },
            register_user_use_case_1.RegisterUserUseCase,
            login_user_use_case_1.LoginUserUseCase,
            request_password_reset_use_case_1.RequestPasswordResetUseCase,
        ],
        exports: [jwt_1.JwtModule],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map