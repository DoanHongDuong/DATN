import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Button, Alert, Spin } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { Hourglass, CheckCircle2, ShieldCheck, Clock, MailWarning } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { useAuth } from '../../hooks/useAuth';
import './auth.css';

type VerifyState = 'loading' | 'success' | 'already_verified' | 'expired' | 'invalid';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, updateUser } = useAuth();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [verifyState, setVerifyState] = useState<VerifyState>(() =>
    !token || !email ? 'invalid' : 'loading',
  );
  const [statusMessage, setStatusMessage] = useState<string>(() =>
    !token || !email ? 'Liên kết xác thực không đầy đủ hoặc thiếu thông tin cần thiết.' : '',
  );
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const calledRef = useRef(false);

  useEffect(() => {
    if (!token || !email || calledRef.current) {
      return;
    }
    calledRef.current = true;

    const performVerification = async () => {
      try {
        const response = await authApi.verifyEmail({ token, email });
        // Cập nhật trạng thái người dùng trong context nếu đang đăng nhập
        updateUser({ emailVerified: true });

        const msg = response.message || '';
        if (msg.includes('trước đó')) {
          setVerifyState('already_verified');
          setStatusMessage(msg || 'Email của bạn đã được xác thực trước đó.');
        } else {
          setVerifyState('success');
          setStatusMessage(msg || 'Xác thực email thành công! Tài khoản của bạn đã được bảo vệ.');
        }
      } catch (err: unknown) {
        const backendMsg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : '';

        if (typeof backendMsg === 'string' && backendMsg.toLowerCase().includes('hết hạn')) {
          setVerifyState('expired');
          setStatusMessage(backendMsg);
        } else {
          setVerifyState('invalid');
          setStatusMessage(backendMsg || 'Liên kết xác thực không hợp lệ hoặc đã từng được sử dụng.');
        }
      }
    };

    performVerification();
  }, [token, email, updateUser]);

  // Đếm ngược tự động chuyển hướng khi thành công
  useEffect(() => {
    if (verifyState !== 'success' && verifyState !== 'already_verified') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(isAuthenticated ? '/dashboard' : '/login', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [verifyState, isAuthenticated, navigate]);

  const handleResend = async () => {
    if (!email) return;
    setResendLoading(true);
    try {
      await authApi.resendVerification(email);
      setResendSent(true);
    } catch {
      // Giữ thông báo trung tính
      setResendSent(true);
    } finally {
      setResendLoading(false);
    }
  };

  const getTargetUrl = () => (isAuthenticated ? '/dashboard' : '/login');
  const getTargetLabel = () => (isAuthenticated ? 'Vào bảng điều khiển' : 'Đăng nhập ngay');

  return (
    <div className="auth-page" role="region" aria-label="Trang xác thực email">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        {/* Header */}
        <div className="auth-card__header">
          <div className="auth-card__icon" aria-hidden="true">
            {verifyState === 'loading' && <Hourglass size={22} />}
            {verifyState === 'success' && <CheckCircle2 size={22} />}
            {verifyState === 'already_verified' && <ShieldCheck size={22} />}
            {verifyState === 'expired' && <Clock size={22} />}
            {verifyState === 'invalid' && <MailWarning size={22} />}
          </div>
          <h2 className="auth-card__title">Xác thực tài khoản</h2>
          <p className="auth-card__subtitle">Hệ thống Hỗ trợ Tâm lý Sinh viên — PSYTHALIA</p>
        </div>

        {/* 1. Trạng thái Đang xử lý */}
        {verifyState === 'loading' && (
          <div
            style={{ textAlign: 'center', padding: '32px 0' }}
            aria-live="polite"
            aria-busy="true"
          >
            <Spin size="large" />
            <p style={{ color: 'var(--text, #333)', marginTop: 20, fontSize: 15 }}>
              Đang kiểm tra và xác minh địa chỉ email của bạn...
            </p>
          </div>
        )}

        {/* 2. Trạng thái Thành công */}
        {verifyState === 'success' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            aria-live="polite"
          >
            <Alert
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              message="Xác nhận email thành công!"
              description={
                <>
                  <p style={{ margin: 0 }}>{statusMessage}</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#666' }}>
                    Tự động chuyển tiếp sau {countdown} giây...
                  </p>
                </>
              }
            />
            <Button
              type="primary"
              size="large"
              block
              onClick={() => navigate(getTargetUrl(), { replace: true })}
            >
              {getTargetLabel()} ({countdown}s)
            </Button>
          </div>
        )}

        {/* 3. Trạng thái Đã xác thực từ trước */}
        {verifyState === 'already_verified' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            aria-live="polite"
          >
            <Alert
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              message="Email đã được xác thực"
              description={
                <>
                  <p style={{ margin: 0 }}>{statusMessage}</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#666' }}>
                    Tự động chuyển tiếp sau {countdown} giây...
                  </p>
                </>
              }
            />
            <Button
              type="primary"
              size="large"
              block
              onClick={() => navigate(getTargetUrl(), { replace: true })}
            >
              {getTargetLabel()} ({countdown}s)
            </Button>
          </div>
        )}

        {/* 4. Trạng thái Hết hạn */}
        {verifyState === 'expired' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            aria-live="polite"
          >
            <Alert
              type="warning"
              showIcon
              icon={<ClockCircleOutlined />}
              message="Liên kết đã hết hiệu lực"
              description={
                statusMessage ||
                'Liên kết xác thực chỉ có thời hạn trong 24 giờ để đảm bảo an toàn. Bạn có thể yêu cầu gửi lại liên kết mới ngay bên dưới.'
              }
            />

            {resendSent ? (
              <Alert
                type="success"
                showIcon
                message="Đã gửi liên kết mới!"
                description={`Liên kết xác thực mới đã được gửi tới email ${email ? `(${email})` : ''}. Vui lòng kiểm tra hộp thư đến của bạn.`}
              />
            ) : (
              email && (
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  size="large"
                  block
                  loading={resendLoading}
                  onClick={handleResend}
                >
                  Gửi lại liên kết xác thực
                </Button>
              )
            )}

            <div className="auth-card__footer" style={{ marginTop: 8 }}>
              <Link
                to={getTargetUrl()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--color-primary)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <ArrowLeftOutlined /> Quay lại {isAuthenticated ? 'trang chủ' : 'đăng nhập'}
              </Link>
            </div>
          </div>
        )}

        {/* 5. Trạng thái Không hợp lệ */}
        {verifyState === 'invalid' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            aria-live="polite"
          >
            <Alert
              type="error"
              showIcon
              icon={<CloseCircleOutlined />}
              message="Liên kết không hợp lệ"
              description={
                statusMessage ||
                'Liên kết xác thực không đúng hoặc đã được sử dụng. Nếu bạn đang đăng nhập, bạn có thể yêu cầu gửi lại liên kết từ thanh thông báo.'
              }
            />

            <Button
              type="default"
              icon={<HomeOutlined />}
              size="large"
              block
              onClick={() => navigate(getTargetUrl())}
            >
              Về {isAuthenticated ? 'trang chủ' : 'trang đăng nhập'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
