import React, { useState, useEffect } from 'react';
import { Button, message } from 'antd';
import { MailOutlined, CloseOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/auth.api';

const DISMISS_KEY = 'psythalia_email_banner_dismissed_at';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const COOLDOWN_SECONDS = 60;

const isStoredDismissed = (): boolean => {
  try {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (!dismissedAt) return false;
    const elapsed = Date.now() - Number(dismissedAt);
    return elapsed < SEVEN_DAYS_MS;
  } catch {
    return false;
  }
};

export const EmailVerificationBanner: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [isDismissed, setIsDismissed] = useState<boolean>(isStoredDismissed);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isSent, setIsSent] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);

  // Bộ đếm ngược thời gian chờ gửi lại (cooldown)
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Ignore storage errors
    }
    setIsDismissed(true);
  };

  const handleResend = async () => {
    if (isSending || cooldown > 0) return;
    setIsSending(true);
    try {
      await authApi.resendVerification(user?.email);
      setIsSent(true);
      setCooldown(COOLDOWN_SECONDS);
      message.success('Đã gửi lại email xác nhận mới. Bạn kiểm tra hòm thư nhé!');
    } catch {
      message.info('Yêu cầu đã được tiếp nhận. Bạn kiểm tra hộp thư đến hoặc mục Spam nhé!');
      setCooldown(COOLDOWN_SECONDS);
    } finally {
      setIsSending(false);
    }
  };

  if (isDismissed || !isAuthenticated || !user || user.emailVerified) {
    return null;
  }

  return (
    <aside
      role="region"
      aria-label="Nhắc nhở xác nhận địa chỉ email"
      style={{
        background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.18)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '13.5px',
        color: 'var(--text)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Nội dung thông báo thấu cảm */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flex: '1 1 300px',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(139, 92, 246, 0.15)',
            color: 'var(--accent, #8b5cf6)',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <MailOutlined style={{ fontSize: '14px' }} />
        </span>
        <span style={{ lineHeight: 1.5 }}>
          Xác nhận email để bạn có thể khôi phục tài khoản khi cần nhé.{' '}
          <span style={{ opacity: 0.85 }}>
            (Bạn vẫn sử dụng các tính năng hỗ trợ bình thường mà không bị gián đoạn).
          </span>
        </span>
      </div>

      {/* Hành động: Gửi lại & Đóng */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginLeft: 'auto',
        }}
      >
        <Button
          size="small"
          type="text"
          loading={isSending}
          disabled={cooldown > 0}
          icon={isSent && cooldown > 0 ? <CheckCircleOutlined style={{ color: '#10b981' }} /> : undefined}
          onClick={handleResend}
          style={{
            fontWeight: 500,
            color: cooldown > 0 ? 'var(--text)' : 'var(--accent, #8b5cf6)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            borderRadius: '6px',
            padding: '2px 10px',
            height: '28px',
          }}
          aria-label={cooldown > 0 ? `Vui lòng đợi ${cooldown} giây để gửi lại` : 'Gửi lại email xác thực'}
        >
          {isSending ? (
            'Đang gửi...'
          ) : cooldown > 0 ? (
            `Gửi lại sau (${cooldown}s)`
          ) : isSent ? (
            'Gửi lại lần nữa'
          ) : (
            'Gửi lại email'
          )}
        </Button>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Đóng thông báo xác nhận email trong 7 ngày"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text)',
            opacity: 0.6,
            cursor: 'pointer',
            padding: '4px 6px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
        >
          <CloseOutlined style={{ fontSize: '12px' }} />
        </button>
      </div>

      <div className="sr-only" aria-live="polite">
        {isSent && 'Email xác nhận mới đã được gửi thành công đến hòm thư của bạn.'}
      </div>
    </aside>
  );
};
