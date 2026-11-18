import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { VerifiedEmailGuard } from '../guards/verified-email.guard';

/**
 * Decorator yêu cầu người dùng phải đăng nhập VÀ có email đã xác thực (emailVerified = true).
 * CHỈ áp dụng cho các tính năng phụ thuộc email (đổi mật khẩu qua email, nhận thông báo email).
 * TUYỆT ĐỐI KHÔNG áp dụng cho các tính năng sơ cứu, làm bài test tâm lý, ghi nhật ký hoặc chat tư vấn!
 */
export function RequireVerifiedEmail() {
  return applyDecorators(UseGuards(JwtAuthGuard, VerifiedEmailGuard));
}
