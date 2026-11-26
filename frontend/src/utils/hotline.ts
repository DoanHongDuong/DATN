const LEGACY_PLACEHOLDERS = ['1900 6789', '1900 6299', '0979877220'];

/**
 * Tiện ích lấy số Hotline hỗ trợ khẩn cấp.
 * Tự động ưu tiên số Đường dây nóng Ngày Mai (096 306 1414), loại bỏ các số giả/placeholder cũ.
 */
export const getEmergencyHotline = (dynamicHotline?: string | null): string => {
  if (dynamicHotline && !LEGACY_PLACEHOLDERS.includes(dynamicHotline.trim())) {
    return dynamicHotline.trim();
  }
  const envVal = import.meta.env.VITE_EMERGENCY_HOTLINE;
  if (envVal && !LEGACY_PLACEHOLDERS.includes(envVal.trim())) {
    return envVal.trim();
  }
  return '096 306 1414';
};
