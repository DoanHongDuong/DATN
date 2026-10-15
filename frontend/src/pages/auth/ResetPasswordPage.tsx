import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Alert } from 'antd';
import { LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { authApi } from '../../api/auth.api';
import './auth.css';

interface ResetPasswordFormValues {
  newPassword: string;
  confirmNewPassword: string;
}

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form] = Form.useForm<ResetPasswordFormValues>();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!success) return;

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
  }, [success, navigate]);

  const onFinish = async (values: ResetPasswordFormValues) => {
    setError(null);

    if (!token || !email) {
      setError('Liên kết đặt lại mật khẩu không hợp lệ hoặc thiếu thông tin.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        email,
        token,
        newPassword: values.newPassword,
        confirmNewPassword: values.confirmNewPassword,
      });
      setSuccess(true);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Không thể đặt lại mật khẩu. Token có thể đã hết hạn hoặc không hợp lệ.';
      setError(errorMsg || 'Không thể đặt lại mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-card__header">
          <div className="auth-card__icon">🔐</div>
          <h2 className="auth-card__title">Đặt lại mật khẩu</h2>
          <p className="auth-card__subtitle">
            {email ? `Tạo mật khẩu mới cho ${email}` : 'Nhập mật khẩu mới cho tài khoản của bạn'}
          </p>
        </div>

        {/* Invalid Token Alert */}
        {(!token || !email) && !success && (
          <div style={{ marginBottom: 20 }}>
            <Alert
              type="error"
              showIcon
              message="Liên kết không hợp lệ"
              description="Liên kết đặt lại mật khẩu thiếu token hoặc email. Vui lòng kiểm tra lại hòm thư hoặc gửi yêu cầu mới."
            />
          </div>
        )}

        {/* API Error Alert */}
        {error && (
          <div style={{ marginBottom: 20 }}>
            <Alert type="error" showIcon message={error} />
          </div>
        )}

        {/* Success View */}
        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Alert
              type="success"
              showIcon
              message="Đổi mật khẩu thành công!"
              description={`Mật khẩu của bạn đã được cập nhật thành công. Đang tự động chuyển hướng đến trang đăng nhập sau ${countdown} giây...`}
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
        ) : (
          /* Reset Password Form */
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            size="large"
            autoComplete="off"
          >
            <Form.Item
              label="Mật khẩu mới"
              name="newPassword"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: 'var(--text)', opacity: 0.5 }} />}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              />
            </Form.Item>

            <Form.Item
              label="Xác nhận mật khẩu mới"
              name="confirmNewPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận lại mật khẩu' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: 'var(--text)', opacity: 0.5 }} />}
                placeholder="Nhập lại mật khẩu mới"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 12 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                disabled={!token || !email}
              >
                Cập nhật mật khẩu
              </Button>
            </Form.Item>
          </Form>
        )}

        {/* Footer */}
        {!success && (
          <div className="auth-card__footer">
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
        )}
      </div>
    </div>
  );
};
