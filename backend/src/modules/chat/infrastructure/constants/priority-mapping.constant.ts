import { SeverityLevel, PriorityLevel } from '@prisma/client';

/**
 * Bảng ánh xạ severity_level → priority_level khi người dùng yêu cầu tư vấn 1-1.
 * Khi sinh viên chủ động bấm "Yêu cầu tư vấn ngay", mức độ ưu tiên luôn được thiết lập
 * ở mức Cao (HIGH), hoặc Khẩn cấp (CRITICAL) nếu kết quả đánh giá tâm lý gần nhất là SEVERE.
 */
export const SEVERITY_TO_PRIORITY_MAP: Record<SeverityLevel, PriorityLevel> = {
  [SeverityLevel.MINIMAL]: PriorityLevel.HIGH,
  [SeverityLevel.MILD]: PriorityLevel.HIGH,
  [SeverityLevel.MODERATE]: PriorityLevel.HIGH,
  [SeverityLevel.MODERATELY_SEVERE]: PriorityLevel.HIGH,
  [SeverityLevel.SEVERE]: PriorityLevel.CRITICAL,
};

/** Giá trị mặc định khi user chưa từng làm test nhưng chủ động gửi yêu cầu tư vấn trực tiếp */
export const DEFAULT_PRIORITY_LEVEL = PriorityLevel.HIGH;
