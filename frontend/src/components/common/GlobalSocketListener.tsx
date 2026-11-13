import React, { useEffect } from 'react';
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
 * - `session_accepted`: Auto-redirect USER đến /chat khi TNV nhận phiên (khi user đang ở trang khác: /assessments, /resources...)
 * - `new_waiting_session`: Hiển thị thông báo + phát âm thanh + push notification cho VOLUNTEER khi có người vào hàng đợi
 * - `waiting_session_accepted`: Cập nhật hàng đợi của TNV khi có phiên vừa được tiếp nhận
 * - `new_notification`: Cập nhật chuông thông báo realtime
 */
export const GlobalSocketListener: React.FC = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Chủ động đề xuất cấp quyền thông báo cho Tình nguyện viên
  useEffect(() => {
    if (user && (user.role === 'VOLUNTEER' || user.role === 'ADMIN')) {
      requestBrowserNotificationPermission().catch(() => { });
    }
  }, [user]);

  useEffect(() => {
    if (!socket || !user) return;

    // === Cho USER: auto-redirect đến /chat khi TNV accept session ===
    const onSessionAccepted = () => {
      // 1. Phát âm thanh chuông êm dịu
      playNotificationSound('chime');

      // 2. Gửi thông báo trình duyệt nếu tab đang ẩn
      sendBrowserNotification(
        '💜 MindCare: Đã kết nối Tình nguyện viên!',
        {
          body: 'Tình nguyện viên vừa tiếp nhận phiên hỗ trợ của bạn. Bấm để vào phòng trò chuyện ngay.',
          tag: 'session-accepted',
        },
        () => navigate('/chat'),
      );

      // 3. Báo chuông thông báo cập nhật
      window.dispatchEvent(new CustomEvent('socket:new_notification'));

      // 4. Nếu đang ở trang khác (/resources, /assessments...), chuyển hướng ngay vào phòng chat
      if (location.pathname !== '/chat') {
        notification.success({
          message: 'Tình nguyện viên đã tiếp nhận phiên hỗ trợ!',
          description: 'Hệ thống đang tự động chuyển bạn vào phòng trò chuyện tư vấn trực tiếp...',
          placement: 'topRight',
          duration: 4,
        });
        navigate('/chat');
      }
    };

    // === Cho VOLUNTEER: thông báo realtime khi có user mới vào hàng đợi ===
    const onNewWaitingSession = (data: { priorityLevel: string; userId?: string }) => {
      // 1. Tuyệt đối không thông báo nếu chính mình là người gửi yêu cầu hỗ trợ này
      if (data?.userId && data.userId === user.id) return;

      // 2. CHỈ thông báo cho Tình nguyện viên đang trực ca (không báo cho User thường hay Admin)
      if (user.role !== 'VOLUNTEER') return;

      const isCritical = data.priorityLevel === 'CRITICAL';

      // 1. Phát âm thanh thông báo (urgent nếu là Critical, chime nếu thông thường)
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
        isCritical ? '🚨 Cảnh báo khẩn cấp (Critical) - Sinh viên chờ hỗ trợ!' : '📋 Có sinh viên vào hàng đợi tư vấn',
        {
          body: `Mức độ ưu tiên: ${priorityLabel}. Bấm vào đây để tiếp nhận phiên tư vấn ngay.`,
          tag: 'waiting-queue',
        },
        () => navigate('/chat'),
      );

      // 3. Toast trong ứng dụng
      notification.info({
        message: '📋 Có sinh viên mới vào hàng đợi tư vấn',
        description: `Mức độ ưu tiên: ${priorityLabel}. Nhấn để xem hoặc tiếp nhận hỗ trợ ngay.`,
        placement: 'topRight',
        duration: 8,
        onClick: () => {
          navigate('/chat');
        },
      });

      // 4. Dispatch event để các component hàng đợi (VolunteerDashboard, ChatPage) tự refresh
      window.dispatchEvent(new CustomEvent('waiting_queue_updated'));
      window.dispatchEvent(new CustomEvent('socket:new_notification'));
    };

    // === Khi một phiên trong hàng đợi đã được TNV khác nhận ===
    const onWaitingSessionAccepted = () => {
      window.dispatchEvent(new CustomEvent('waiting_queue_updated'));
    };

    // === Cập nhật notification count realtime ===
    const onNewNotification = () => {
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
  }, [socket, user, navigate, location.pathname]);

  return null;
};
