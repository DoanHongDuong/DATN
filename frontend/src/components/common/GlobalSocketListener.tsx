import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { notification } from 'antd';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { playNotificationSound } from '../../utils/sound';
import {
  sendBrowserNotification,
  requestBrowserNotificationPermission,
} from '../../utils/browserNotification';

/**
 * Component listener toàn cục cho các sự kiện socket quan trọng:
 * - `session_accepted`: Auto-redirect USER đến /chat khi TNV nhận phiên (khi user đang ở trang khác)
 * - `new_waiting_session`: Hiển thị thông báo + phát âm thanh + push notification cho VOLUNTEER khi có người vào hàng đợi
 * - `waiting_session_accepted`: Cập nhật hàng đợi của TNV khi có phiên vừa được tiếp nhận
 * - `new_notification`: Cập nhật chuông thông báo realtime
 *
 * Cải tiến Kiến trúc chống trùng lặp (Anti-Duplication Architecture):
 * 1. location.pathname được quản lý qua useRef, không đặt trong dependency array của useEffect socket
 *    => Đảm bảo socket listener KHÔNG bị hủy rồi đăng ký lại mỗi khi chuyển trang hay đóng/mở Mobile Drawer.
 * 2. Bộ nhớ đệm deduplication (processedEventsRef) ghi nhớ eventId trong 5 giây
 *    => Ngăn chặn hoàn toàn việc phát âm thanh / thông báo kép do reconnect mạng hay server broadcast nhiều lần.
 * 3. Đặt key định danh duy nhất cho Ant Design notification
 *    => Ant Design tự động cập nhật notification hiện tại thay vì hiển thị nhiều thông báo chồng lấn.
 */
export const GlobalSocketListener: React.FC = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Lưu location.pathname vào ref để listener socket luôn đọc được đường dẫn hiện tại mà không phải re-bind listener
  const locationRef = useRef(location.pathname);
  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  // Bộ nhớ đệm chống trùng lặp event (ID -> timestamp)
  const processedEventsRef = useRef<Map<string, number>>(new Map());
  const lastNotifDispatchRef = useRef<number>(0);

  // Chủ động đề xuất cấp quyền thông báo cho Tình nguyện viên
  useEffect(() => {
    if (user && (user.role === 'VOLUNTEER' || user.role === 'ADMIN')) {
      requestBrowserNotificationPermission().catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (!socket || !user) return;

    // === Cho USER: auto-redirect đến /chat khi TNV accept session ===
    const onSessionAccepted = (session?: { id?: string }) => {
      const eventKey = `session_accepted_${session?.id || 'active'}`;
      const now = Date.now();
      const lastTime = processedEventsRef.current.get(eventKey) || 0;
      if (now - lastTime < 5000) return; // Bỏ qua trùng lặp trong vòng 5 giây
      processedEventsRef.current.set(eventKey, now);

      // 1. Phát âm thanh chuông êm dịu
      playNotificationSound('chime');

      // 2. Gửi thông báo trình duyệt nếu tab đang ẩn
      sendBrowserNotification(
        '💜 PSYTHALIA: Đã kết nối Tình nguyện viên!',
        {
          body: 'Tình nguyện viên vừa tiếp nhận phiên hỗ trợ của bạn. Bấm để vào phòng trò chuyện ngay.',
          tag: 'session-accepted',
        },
        () => navigate('/chat'),
      );

      // 3. Báo chuông thông báo cập nhật
      window.dispatchEvent(new CustomEvent('socket:new_notification'));

      // 4. CHỈ hiển thị notification toast nếu người dùng KHÔNG ở trang /chat
      // (Nếu đang ở /chat, ChatPage sẽ chủ động hiển thị in-chat toast để tránh 2 thông báo đè nhau)
      if (locationRef.current !== '/chat') {
        notification.success({
          key: `session-accepted-${session?.id || 'active'}`,
          message: 'Tình nguyện viên đã tiếp nhận phiên hỗ trợ!',
          description: 'Hệ thống đang tự động chuyển bạn vào phòng trò chuyện tư vấn trực tiếp...',
          placement: 'topRight',
          duration: 4,
        });
        navigate('/chat');
      }
    };

    // === Cho VOLUNTEER: thông báo realtime khi có người mới vào hàng đợi ===
    const onNewWaitingSession = (data: { id?: string; priorityLevel: string; userId?: string }) => {
      // 1. Tuyệt đối không thông báo nếu chính mình là người gửi yêu cầu hỗ trợ này
      if (data?.userId && data.userId === user.id) return;

      // 2. CHỈ thông báo cho Tình nguyện viên đang trực ca (không báo cho User thường hay Admin)
      if (user.role !== 'VOLUNTEER') return;

      // Deduplicate theo session ID
      const eventKey = `waiting_session_${data?.id || data?.userId || 'unknown'}`;
      const now = Date.now();
      const lastTime = processedEventsRef.current.get(eventKey) || 0;
      if (now - lastTime < 5000) return; // Bỏ qua trùng lặp trong 5 giây
      processedEventsRef.current.set(eventKey, now);

      const isCritical = data.priorityLevel === 'CRITICAL';

      // 1. Phát âm thanh thông báo
      playNotificationSound(isCritical ? 'urgent' : 'chime');

      const priorityLabel =
        data.priorityLevel === 'CRITICAL'
          ? '🔴 Rất cao (Critical)'
          : data.priorityLevel === 'HIGH'
            ? '🟠 Cao (High)'
            : data.priorityLevel === 'MEDIUM'
              ? '🔵 Trung bình (Medium)'
              : '🟢 Thấp (Low)';

      // 2. Gửi thông báo trình duyệt native
      sendBrowserNotification(
        isCritical ? '🚨 Cảnh báo khẩn cấp (Critical) - Có người chờ hỗ trợ!' : '📋 Có người dùng vào hàng đợi tư vấn',
        {
          body: `Mức độ ưu tiên: ${priorityLabel}. Bấm vào đây để tiếp nhận phiên tư vấn ngay.`,
          tag: 'waiting-queue',
        },
        () => navigate('/chat'),
      );

      // 3. Toast trong ứng dụng có key định danh chống đè
      notification.info({
        key: `new-waiting-session-${data?.id || 'latest'}`,
        message: '📋 Có người dùng mới vào hàng đợi tư vấn',
        description: `Mức độ ưu tiên: ${priorityLabel}. Nhấn để xem hoặc tiếp nhận hỗ trợ ngay.`,
        placement: 'topRight',
        duration: 8,
        onClick: () => {
          navigate('/chat');
        },
      });

      // 4. Dispatch event để các component hàng đợi tự refresh
      window.dispatchEvent(new CustomEvent('waiting_queue_updated'));
      window.dispatchEvent(new CustomEvent('socket:new_notification'));
    };

    // === Khi một phiên trong hàng đợi đã được TNV khác nhận ===
    const onWaitingSessionAccepted = (data?: { sessionId?: string }) => {
      const eventKey = `session_accepted_queue_${data?.sessionId || 'unknown'}`;
      const now = Date.now();
      const lastTime = processedEventsRef.current.get(eventKey) || 0;
      if (now - lastTime < 3000) return;
      processedEventsRef.current.set(eventKey, now);
      window.dispatchEvent(new CustomEvent('waiting_queue_updated'));
    };

    // === Cập nhật notification count realtime (có debounce chống dồn event) ===
    const onNewNotification = () => {
      const now = Date.now();
      if (now - lastNotifDispatchRef.current < 1200) return;
      lastNotifDispatchRef.current = now;
      window.dispatchEvent(new CustomEvent('socket:new_notification'));
    };

    socket.on('session_accepted', onSessionAccepted);
    socket.on('new_waiting_session', onNewWaitingSession);
    socket.on('waiting_session_accepted', onWaitingSessionAccepted);
    socket.on('new_notification', onNewNotification);

    return () => {
      socket.off('session_accepted', onSessionAccepted);
      socket.off('new_waiting_session', onNewWaitingSession);
      socket.off('waiting_session_accepted', onWaitingSessionAccepted);
      socket.off('new_notification', onNewNotification);
    };
  }, [socket, user, navigate]);

  return null;
};
