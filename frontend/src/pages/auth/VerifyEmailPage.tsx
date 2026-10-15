import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Button, Alert, Spin } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { authApi } from '../../api/auth.api';
import './auth.css';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const isMissingParams = !token || !email;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(() =>
    isMissingParams ? 'error' : 'loading',
  );
  const [message, setMessage] = useState<string>(() =>
    isMissingParams ? 'Liên kết xác minh không hợp lệ hoặc thiếu thông tin cần thiết.' : '',
  );
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!token || !email) {
      return;
    }


    let isMounted = true;

    const verify = async () => {
      try {
        const res = await authApi.verifyEmail({ token, email });
        if (isMounted) {
          setStatus('success');
          setMessage(res.message || 'Email của bạn đã được xác minh thành công!');
        }
      } catch (err: unknown) {
        if (isMounted) {
          setStatus('error');
          const errorMsg =
            err && typeof err === 'object' && 'response' in err
              ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
              : 'Xác minh email thất bại. Token có thể đã hết hạn hoặc không hợp lệ.';
          setMessage(errorMsg || 'Xác minh email thất bại.');
        }
      }
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, [token, email]);

  useEffect(() => {
    if (status !== 'success') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, navigate]);

  const handleResend = async () => {
    if (!email) return;
    setResendLoading(true);
    try {
      await authApi.resendVerification(email);
      setResendSuccess(true);
    } catch {
      // Ignored
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-card__header">
          <div className="auth-card__icon">✉️</div>
          <h2 className="auth-card__title">Xác thực tài khoản</h2>
          <p className="auth-card__subtitle">Hệ thống Hỗ trợ Sức khỏe Tâm thần Sinh viên</p>
        </div>

        {/* Content based on status */}
        {status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <Spin size="large" />
            <p style={{ color: 'var(--text)', marginTop: 20, fontSize: 15 }}>
              Đang xác minh địa chỉ email của bạn...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Alert
              type="success"
              showIcon
              message="Xác minh email thành công!"
              description={`${message} Đang tự động chuyển hướng đến trang đăng nhập sau ${countdown} giây...`}
            />
            <Button
              type="primary"
              size="large"
              block
              onClick={() => navigate('/login')}
            >
              Đăng nhập ngay ({countdown}s)
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Alert
              type="error"
              showIcon
              message="Xác minh thất bại"
              description={message}
            />

            {resendSuccess && (
              <Alert
                type="info"
                showIcon
                message="Đã gửi lại email xác nhận mới!"
                description="Vui lòng kiểm tra hộp thư đến hoặc mục thư rác trong Gmail của bạn."
              />
            )}

            {!resendSuccess && email && (
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                size="large"
                block
                loading={resendLoading}
                onClick={handleResend}
              >
                Gửi lại email xác thực
              </Button>
            )}

            <div className="auth-card__footer" style={{ marginTop: 8 }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ArrowLeftOutlined /> Quay lại Đăng nhập
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
