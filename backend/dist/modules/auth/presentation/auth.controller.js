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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_1 = require("@nestjs/jwt");
const register_user_use_case_1 = require("../application/use-cases/register-user.use-case");
const login_user_use_case_1 = require("../application/use-cases/login-user.use-case");
const request_password_reset_use_case_1 = require("../application/use-cases/request-password-reset.use-case");
const reset_password_use_case_1 = require("../application/use-cases/reset-password.use-case");
const verify_email_use_case_1 = require("../application/use-cases/verify-email.use-case");
const resend_verification_email_use_case_1 = require("../application/use-cases/resend-verification-email.use-case");
const register_dto_1 = require("../application/dto/register.dto");
const login_dto_1 = require("../application/dto/login.dto");
const forgot_password_dto_1 = require("../application/dto/forgot-password.dto");
const verify_email_dto_1 = require("../application/dto/verify-email.dto");
const reset_password_dto_1 = require("../application/dto/reset-password.dto");
const change_password_dto_1 = require("../application/dto/change-password.dto");
const change_password_use_case_1 = require("../application/use-cases/change-password.use-case");
const throttler_1 = require("@nestjs/throttler");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const user_repository_interface_1 = require("../domain/repositories/user.repository.interface");
let AuthController = class AuthController {
    registerUserUseCase;
    loginUserUseCase;
    requestPasswordResetUseCase;
    resetPasswordUseCase;
    verifyEmailUseCase;
    resendVerificationEmailUseCase;
    changePasswordUseCase;
    userRepository;
    jwtService;
    constructor(registerUserUseCase, loginUserUseCase, requestPasswordResetUseCase, resetPasswordUseCase, verifyEmailUseCase, resendVerificationEmailUseCase, changePasswordUseCase, userRepository, jwtService) {
        this.registerUserUseCase = registerUserUseCase;
        this.loginUserUseCase = loginUserUseCase;
        this.requestPasswordResetUseCase = requestPasswordResetUseCase;
        this.resetPasswordUseCase = resetPasswordUseCase;
        this.verifyEmailUseCase = verifyEmailUseCase;
        this.resendVerificationEmailUseCase = resendVerificationEmailUseCase;
        this.changePasswordUseCase = changePasswordUseCase;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }
    register(dto) {
        return this.registerUserUseCase.execute(dto);
    }
    login(dto) {
        return this.loginUserUseCase.execute(dto);
    }
    verifyEmail(dto) {
        return this.verifyEmailUseCase.execute(dto);
    }
    async resendVerification(req, dto) {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const payload = this.jwtService.decode(token);
                if (payload?.sub) {
                    return this.resendVerificationEmailUseCase.execute({ userId: payload.sub });
                }
            }
            catch {
            }
        }
        if (dto?.email) {
            return this.resendVerificationEmailUseCase.execute({ email: dto.email });
        }
        throw new common_1.BadRequestException('Vui lòng cung cấp địa chỉ email hoặc đăng nhập để gửi lại email xác thực');
    }
    forgotPassword(dto) {
        return this.requestPasswordResetUseCase.execute(dto);
    }
    resetPassword(dto) {
        return this.resetPasswordUseCase.execute(dto);
    }
    changePassword(req, dto) {
        return this.changePasswordUseCase.execute(req.user.userId, dto);
    }
    async getProfile(req) {
        const user = await this.userRepository.findById(req.user.userId);
        return {
            userId: req.user.userId,
            role: req.user.role,
            email: user?.email || '',
            fullName: user?.fullName || '',
            emailVerified: user?.emailVerified ?? false,
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Đăng ký tài khoản mới' }),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 900000 } }),
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Đăng nhập vào hệ thống' }),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 900000 } }),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Xác minh email sau khi đăng ký' }),
    (0, common_1.Post)('verify-email'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_email_dto_1.VerifyEmailDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Gửi lại email xác minh (Giới hạn 3 lần/giờ)' }),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 3600000 } }),
    (0, common_1.Post)('resend-verification'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resendVerification", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Yêu cầu khôi phục mật khẩu' }),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 900000 } }),
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Đặt lại mật khẩu bằng token' }),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 900000 } }),
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Đổi mật khẩu tài khoản' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, throttler_1.ThrottlerGuard),
    (0, throttler_1.Throttle)({ default: { limit: 5, ttl: 900000 } }),
    (0, common_1.Post)('change-password'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_password_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Lấy thông tin tài khoản hiện tại' }),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __param(7, (0, common_1.Inject)(user_repository_interface_1.USER_REPOSITORY)),
    __metadata("design:paramtypes", [register_user_use_case_1.RegisterUserUseCase,
        login_user_use_case_1.LoginUserUseCase,
        request_password_reset_use_case_1.RequestPasswordResetUseCase,
        reset_password_use_case_1.ResetPasswordUseCase,
        verify_email_use_case_1.VerifyEmailUseCase,
        resend_verification_email_use_case_1.ResendVerificationEmailUseCase,
        change_password_use_case_1.ChangePasswordUseCase, Object, jwt_1.JwtService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map