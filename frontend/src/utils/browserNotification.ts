/**
 * Module quản lý HTML5 Web Notification API.
 * Cho phép hiển thị thông báo native của hệ điều hành / trình duyệt
 * khi người dùng đang chuyển sang tab khác hoặc thu nhỏ cửa sổ.
 */

export const isBrowserNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const requestBrowserNotificationPermission = async (): Promise<boolean> => {
  if (!isBrowserNotificationSupported()) return false;
  try {
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  } catch {
    return false;
  }
};

export const sendBrowserNotification = (
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
  },
  onClick?: () => void,
) => {
  if (!isBrowserNotificationSupported()) return;

  if (Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body: options?.body,
        icon: options?.icon || '/favicon.ico',
        tag: options?.tag || 'mindcare-alert',
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
        if (onClick) {
          onClick();
        }
      };
    } catch {
      // Bỏ qua lỗi sandbox/browser security
    }
  }
};

