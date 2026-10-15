import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { authApi, type RegisterPayload } from '../../api/auth.api';
import './auth.css';

interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

export const RegisterPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => {
      // Làm sạch payload: loại bỏ phone nếu để trống
      const cleanPayload: RegisterPayload = {
        fullName: payload.fullName.trim(),
        email: payload.email.trim(),
        password: payload.password,
        confirmPassword: payload.confirmPassword,
        phone: payload.phone?.trim() || undefined,
      };
      return authApi.register(cleanPayload);
    },
    onSuccess: (_data, variables) => {
      message.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
      navigate('/login', { state: { email: variables.email.trim() } });
    },
    onError: (error: unknown) => {
      let errorMsg = 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.';
      if (axios.isAxiosError(error)) {
        const axiosErr = error as AxiosError<ApiErrorResponse>;
        if (!axiosErr.response) {
          errorMsg = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend server (CORS / Network).';
        } else {
          const backendMessage = axiosErr.response.data?.message;
          if (Array.isArray(backendMessage)) {
            errorMsg = backendMessage.join(', ');
          } else if (typeof backendMessage === 'string') {
            errorMsg = backendMessage;
          }
        }
      }
      message.error(errorMsg);
    },
  });

  const onFinish = (values: RegisterPayload & { confirmPassword: string }) => {
    registerMutation.mutate(values);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-card__header">
          <div className="auth-card__icon">🌱</div>
          <h2 className="auth-card__title">Đăng ký tài khoản</h2>
          <p className="auth-card__subtitle">
            Tạo tài khoản để sử dụng dịch vụ hỗ trợ tâm lý
          </p>
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
                label="Họ và tên"
                name="fullName"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: 'var(--text)', opacity: 0.5 }} />}
                  placeholder="Nguyễn Văn A"
                />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email' },
                  { type: 'email', message: 'Email không đúng định dạng' },
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: 'var(--text)', opacity: 0.5 }} />}
                  placeholder="user@example.com"
                />
              </Form.Item>

              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[
                  {
                    pattern: /^(0[3|5|7|8|9])+(\d{8})$/,
                    message: 'Số điện thoại không hợp lệ (VD: 0912345678)',
                  },
                ]}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: 'var(--text)', opacity: 0.5 }} />}
                  placeholder="0912345678 (không bắt buộc)"
                />
              </Form.Item>

              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu' },
                  { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
                  {
                    pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
                    message: 'Mật khẩu phải chứa cả chữ cái và chữ số',
                  },
                ]}
                hasFeedback
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: 'var(--text)', opacity: 0.5 }} />}
                  placeholder="Ít nhất 8 ký tự (gồm cả chữ và số)"
                />
              </Form.Item>

              <Form.Item
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                dependencies={['password']}
                hasFeedback
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: 'var(--text)', opacity: 0.5 }} />}
                  placeholder="Nhập lại mật khẩu"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={registerMutation.isPending}
                >
                  Đăng ký
                </Button>
              </Form.Item>
            </Form>

            {/* Footer */}
            <div className="auth-card__footer">
              Đã có tài khoản?{' '}
              <Link to="/login">Đăng nhập</Link>
            </div>
      </div>
    </div>
  );
};


