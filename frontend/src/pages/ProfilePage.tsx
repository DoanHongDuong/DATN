import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Card, Form, Input, Button, message, Tag, Typography, Divider, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, SafetyCertificateOutlined, CalendarOutlined } from '@ant-design/icons';
import { userApi, type UserDetail } from '../api/user.api';
import { authApi } from '../api/auth.api';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const { Title, Text } = Typography;

export const ProfilePage: React.FC = () => {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState<UserDetail | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [updatingProfile, setUpdatingProfile] = useState<boolean>(false);
  const [changingPassword, setChangingPassword] = useState<boolean>(false);

  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const data = await userApi.getMe();
        if (isMounted) {
          setProfile(data);
          profileForm.setFieldsValue({
            fullName: data.fullName,
            phone: data.phone || '',
          });
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        message.error('Không thể tải thông tin hồ sơ');
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [profileForm]);

  const handleUpdateProfile = async (values: { fullName: string; phone?: string }) => {
    setUpdatingProfile(true);
    try {
      const updated = await userApi.updateMe({
        fullName: values.fullName.trim(),
        phone: values.phone?.trim() || undefined,
      });
      setProfile(updated);
      updateUser({ fullName: updated.fullName });
      message.success('Cập nhật thông tin hồ sơ thành công!');
    } catch (err: unknown) {
      let errMsg = 'Không thể cập nhật hồ sơ';
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        const msg = err.response.data.message;
        errMsg = Array.isArray(msg) ? msg.join(', ') : msg;
      }
      message.error(errMsg);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (values: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => {
    setChangingPassword(true);
    try {
      const res = await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmNewPassword: values.confirmNewPassword,
      });
      message.success(res.message || 'Đổi mật khẩu thành công!');
      passwordForm.resetFields();
    } catch (err: unknown) {
      let errMsg = 'Đổi mật khẩu thất bại';
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        const msg = err.response.data.message;
        errMsg = Array.isArray(msg) ? msg.join(', ') : msg;
      }
      message.error(errMsg);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loadingProfile) {
    return <LoadingSpinner message="Đang tải thông tin tài khoản..." />;
  }

  const roleTagConfig = {
    ADMIN: { color: 'purple', label: 'Quản trị viên (Admin)' },
    VOLUNTEER: { color: 'green', label: 'Tình nguyện viên' },
    USER: { color: 'blue', label: 'Người dùng sinh viên' },
  }[profile?.role || 'USER'] || { color: 'default', label: profile?.role };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <Title level={2} style={{ margin: 0, color: 'var(--text-h)' }}>
          Hồ sơ cá nhân & Bảo mật
        </Title>
        <Text type="secondary" style={{ fontSize: '15px' }}>
          Quản lý thông tin tài khoản và thiết lập mật khẩu của bạn
        </Text>
      </div>

      {/* Card 1: Thông tin hồ sơ */}
      <Card
        title={
          <Space>
            <UserOutlined style={{ color: 'var(--accent)' }} />
            <span>Thông tin cá nhân (PB-05)</span>
          </Space>
        }
        bordered
        style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleUpdateProfile}
          initialValues={{
            fullName: profile?.fullName,
            phone: profile?.phone || '',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <Form.Item label="Địa chỉ Email (Chỉ đọc)">
              <Input
                prefix={<MailOutlined />}
                value={profile?.email}
                disabled
                style={{ backgroundColor: 'var(--code-bg, #f3f4f6)', color: 'var(--text)' }}
              />
            </Form.Item>

            <Form.Item label="Vai trò tài khoản">
              <div style={{ display: 'flex', alignItems: 'center', height: '32px', gap: '10px' }}>
                <Tag color={roleTagConfig.color} icon={<SafetyCertificateOutlined />}>
                  {roleTagConfig.label}
                </Tag>
                {profile?.role === 'VOLUNTEER' && (
                  <Link to="/dashboard" style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 500 }}>
                    Hồ sơ chuyên môn & Bàn trực →
                  </Link>
                )}
              </div>
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <Form.Item
              name="fullName"
              label="Họ và tên"
              rules={[
                { required: true, message: 'Vui lòng nhập họ và tên' },
                { min: 2, max: 100, message: 'Họ và tên phải từ 2 đến 100 ký tự' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Nguyễn Văn A" maxLength={100} />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[
                {
                  pattern: /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/,
                  message: 'Số điện thoại không đúng định dạng VN (VD: 0912345678 hoặc +84912345678)',
                },
              ]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="0912345678 (tùy chọn)" />
            </Form.Item>
          </div>

          {profile?.createdAt && (
            <div style={{ marginBottom: '16px', color: 'var(--text)', fontSize: '13px' }}>
              <Space>
                <CalendarOutlined />
                <span>
                  Ngày tham gia: <strong>{new Date(profile.createdAt).toLocaleDateString('vi-VN')}</strong>
                </span>
              </Space>
            </div>
          )}

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={updatingProfile}
              style={{
                borderRadius: '8px',
                background: 'var(--accent, #9333ea)',
                borderColor: 'var(--accent, #9333ea)',
                fontWeight: 600,
              }}
            >
              Lưu thay đổi hồ sơ
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Card 2: Đổi mật khẩu */}
      <Card
        title={
          <Space>
            <LockOutlined style={{ color: '#e11d48' }} />
            <span>Đổi mật khẩu (PB-06)</span>
          </Space>
        }
        bordered
        style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="currentPassword"
            label="Mật khẩu hiện tại"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu hiện tại của bạn"
            />
          </Form.Item>

          <Divider style={{ margin: '16px 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <Form.Item
              name="newPassword"
              label="Mật khẩu mới"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                { min: 8, message: 'Mật khẩu mới phải có tối thiểu 8 ký tự' },
                {
                  pattern: /^(?=.*[A-Za-z])(?=.*\d)/,
                  message: 'Mật khẩu phải chứa ít nhất 1 chữ cái và 1 chữ số',
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (value && value === getFieldValue('currentPassword')) {
                      return Promise.reject(new Error('Mật khẩu mới không được trùng mật khẩu hiện tại'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Tối thiểu 8 ký tự (chữ và số)"
              />
            </Form.Item>

            <Form.Item
              name="confirmNewPassword"
              label="Xác nhận mật khẩu mới"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Nhập lại mật khẩu mới"
              />
            </Form.Item>
          </div>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              danger
              htmlType="submit"
              loading={changingPassword}
              style={{
                borderRadius: '8px',
                fontWeight: 600,
              }}
            >
              Cập nhật mật khẩu
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
