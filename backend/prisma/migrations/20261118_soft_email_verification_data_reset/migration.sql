-- Migration: Đặt lại trạng thái email_verified chính xác cho tài khoản người dùng cũ
-- Lý do nghiệp vụ: Trước đây khi đăng ký, hệ thống tự động gán email_verified = true.
-- Để áp dụng Soft Verification, các tài khoản vai trò USER thông thường được chuyển về false
-- để người dùng có thể chủ động xác thực khi cần khôi phục tài khoản.
-- Các tài khoản ADMIN, Tình nguyện viên (VOLUNTEER) hoặc tài khoản seed hệ thống được giữ nguyên true.

UPDATE "users"
SET "email_verified" = false
WHERE "role" = 'USER'
  AND "email" NOT LIKE '%admin%'
  AND "email" NOT LIKE '%datn.local%';
