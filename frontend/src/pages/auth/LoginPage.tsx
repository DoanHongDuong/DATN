import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { authApi, type LoginPayload } from '../../api/auth.api';
import { useAuth } from '../../hooks/useAuth';
import './auth.css';

interface ApiErrorResponse {
  message?: string | string[];
}

export const LoginPage: React.FC = () => {
  const { setAuthData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm<LoginPayload>();

  useEffect(() => {
    if (location.state?.email) {
      form.setFieldsValue({ email: location.state.email });
    }
  }, [location.state, form]);

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      setAuthData(data);
      message.success('Đăng nhập thành công!');
      if (data.user?.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    },
    onError: (error: unknown) => {
      let msg = 'Đăng nhập thất bại. Vui lòng kiểm tra lại email/mật khẩu.';
      if (axios.isAxiosError(error)) {
        const axiosErr = error as AxiosError<ApiErrorResponse>;
        if (!axiosErr.response) {
          msg = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend server.';
        } else {
          const backendMsg = axiosErr.response.data?.message;
          if (Array.isArray(backendMsg)) {
            msg = backendMsg.join(', ');
          } else if (typeof backendMsg === 'string') {
            msg = backendMsg;
          }
        }
      }
      message.error(msg);
    },
  });

  const onFinish = (values: LoginPayload) => {
    loginMutation.mutate(values);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-card__header">
          <div className="auth-card__icon">🔐</div>
          <h2 className="auth-card__title">Đăng nhập</h2>
          <p className="auth-card__subtitle">Chào mừng bạn đến với MindCare</p>
        </div>

        {/* Form */}
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
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: 'var(--text)', opacity: 0.5 }} />}
              placeholder="nhap.email@example.com"
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            style={{ marginBottom: 12 }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--text)', opacity: 0.5 }} />}
              placeholder="••••••••"
            />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <Link to="/forgot-password" style={{ fontSize: '13px', fontWeight: 500 }}>
              Quên mật khẩu?
            </Link>
          </div>

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loginMutation.isPending}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        {/* Footer */}
        <div className="auth-card__footer">
          Chưa có tài khoản?{' '}
          <Link to="/register">Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
};
