/**
 * Tiện ích lấy số Hotline hỗ trợ khẩn cấp.
 * Tự động ưu tiên số mới 0979877220, loại bỏ giá trị mặc định cũ 1900 6789.
 */
export const getEmergencyHotline = (dynamicHotline?: string | null): string => {
  if (dynamicHotline && dynamicHotline !== '1900 6789') {
    return dynamicHotline;
  }
  const envVal = import.meta.env.VITE_EMERGENCY_HOTLINE;
  if (envVal && envVal !== '1900 6789') {
    return envVal;
  }
  return '0979877220';
};
