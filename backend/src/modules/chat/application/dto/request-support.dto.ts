/**
 * DTO cho UC-06 Request Support.
 * userId lấy từ JWT (không có field ở đây), endpoint chỉ cần gọi — body rỗng.
 * File này tồn tại để giữ cấu trúc DTO nhất quán và dễ mở rộng trong tương lai
 * (VD: thêm lý do yêu cầu hỗ trợ).
 */
export class RequestSupportDto {
  // Hiện tại không cần field nào — userId được lấy từ JWT payload.
  // Giữ class rỗng để pipe validate không lỗi và dễ mở rộng.
}
