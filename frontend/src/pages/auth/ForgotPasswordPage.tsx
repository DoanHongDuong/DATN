import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form, Input, Button, Alert } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { authApi } from '../../api/auth.api';
import './auth.css';

interface ForgotPasswordFormValues {
  email: string;
}

export const ForgotPasswordPage: React.FC = () => {
  const [form] = Form.useForm<ForgotPasswordFormValues>();
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => {
      setErrorMessage(null);
      setIsSubmitted(true);
    },
    onError: (error: unknown) => {
      const axiosErr = error as AxiosError<{ message?: string }>;
      const status = axiosErr?.response?.status;
      if (status === 429) {
        setErrorMessage('Bạn đã gửi yêu cầu quá nhiều lần. Vui lòng đợi 15 phút rồi thử lại.');
      } else if (status && status >= 500) {
        setErrorMessage('Dịch vụ máy chủ gửi email đang gặp sự cố. Vui lòng thử lại sau ít phút.');
      } else {
        setErrorMessage(
          axiosErr?.response?.data?.message || 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.',
        );
      }
    },
  });

  const onFinish = (values: ForgotPasswordFormValues) => {
    setErrorMessage(null);
    forgotPasswordMutation.mutate(values.email);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-card__header">
          <div className="auth-card__icon">🔑</div>
          <h2 className="auth-card__title">Quên mật khẩu</h2>
          <p className="auth-card__subtitle">
            Nhập email tài khoản của bạn để nhận hướng dẫn khôi phục mật khẩu.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <Alert
            type="error"
            showIcon
            message={errorMessage}
            style={{ marginBottom: 16 }}
            closable
            onClose={() => setErrorMessage(null)}
          />
        )}

        {/* Success Alert */}
        {isSubmitted ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Alert
              type="success"
              showIcon
              message="Yêu cầu đã được ghi nhận"
              description="Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hộp thư của bạn."
            />
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  color: 'var(--accent)',
                }}
              >
                <ArrowLeftOutlined /> Quay lại đăng nhập
              </Link>
            </div>
          </div>
        ) : (
          /* Form */
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            size="large"
            autoComplete="off"
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email của bạn' },
                { type: 'email', message: 'Email không hợp lệ' },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: 'var(--text)', opacity: 0.5 }} />}
                placeholder="nhap.email@example.com"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={forgotPasswordMutation.isPending}
              >
                Gửi yêu cầu đặt lại mật khẩu
              </Button>
            </Form.Item>
          </Form>
        )}

        {/* Footer */}
        {!isSubmitted && (
          <div className="auth-card__footer">
            Nhớ mật khẩu? <Link to="/login">Đăng nhập</Link>
          </div>
        )}
      </div>
    </div>
  );
};
