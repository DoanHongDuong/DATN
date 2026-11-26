/**
 * Tiện ích lấy số Hotline hỗ trợ khẩn cấp.
 * Tự động ưu tiên số mới 1900 6299, loại bỏ các giá trị cũ (1900 6789, 0979877220).
 */
export const getEmergencyHotline = (dynamicHotline?: string | null): string => {
  if (dynamicHotline && dynamicHotline !== '1900 6789' && dynamicHotline !== '0979877220') {
    return dynamicHotline;
  }
  const envVal = import.meta.env.VITE_EMERGENCY_HOTLINE;
  if (envVal && envVal !== '1900 6789' && envVal !== '0979877220') {
    return envVal;
  }
  return '1900 6299';
};
