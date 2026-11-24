import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Card, Form, Input, Button, message } from 'antd';
import {
  User,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { userApi, type UserDetail } from '../api/user.api';
import { authApi } from '../api/auth.api';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import './profile.css';

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

  // Calculate initials for Avatar
  const getInitials = (name?: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const roleConfig = {
    ADMIN: { label: 'Quản trị viên', className: 'profile-role-tag--admin' },
    VOLUNTEER: { label: 'Tình nguyện viên', className: 'profile-role-tag--volunteer' },
    USER: { label: 'Người dùng', className: 'profile-role-tag--user' },
  }[profile?.role || 'USER'] || { label: profile?.role || 'Người dùng', className: 'profile-role-tag--user' };

  return (
    <div className="profile-page-container">
      {/* Header */}
      <div className="profile-header">
        <h1 className="profile-header__title">
          Hồ sơ cá nhân & Bảo mật
        </h1>
        <p className="profile-header__subtitle">
          Quản lý thông tin tài khoản cá nhân, thông tin liên hệ và thiết lập bảo vệ mật khẩu của bạn.
        </p>
      </div>

      {/* Hero Identity Card */}
      <div className="profile-hero-card">
        <div className="profile-hero-identity">
          <div className="profile-avatar" aria-hidden="true">
            {getInitials(profile?.fullName)}
          </div>
          <div className="profile-hero-info">
            <h2 className="profile-hero-name">
              {profile?.fullName || 'Người dùng'}
            </h2>
            <div className="profile-hero-meta">
              <span className={`profile-role-tag ${roleConfig.className}`}>
                <ShieldCheck size={14} />
                {roleConfig.label}
              </span>
              <span className="profile-verified-badge">
                <CheckCircle2 size={15} />
                Email đã xác thực
              </span>
              {profile?.createdAt && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Calendar size={14} />
                  Thành viên từ: {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
                </span>
              )}
            </div>
          </div>
        </div>

        {profile?.role === 'VOLUNTEER' && (
          <Link
            to="/chat"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              background: 'var(--tint-sage)',
              color: 'var(--color-secondary)',
              fontSize: '13.5px',
              fontWeight: 600,
              textDecoration: 'none',
              border: '1px solid rgba(58, 117, 88, 0.2)',
              transition: 'opacity 0.2s ease',
            }}
          >
            Đến Hàng đợi Tư vấn <ExternalLink size={14} />
          </Link>
        )}
      </div>

      {/* Content Grid */}
      <div className="profile-grid">
        {/* Card 1: Thông tin cá nhân */}
        <Card
          className="profile-card"
          title={
            <div className="profile-card-header">
              <div className="profile-card-header__icon profile-card-header__icon--personal">
                <User size={18} />
              </div>
              <span>Thông tin cá nhân</span>
            </div>
          }
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
            <Form.Item label="Địa chỉ Email (Cố định)">
              <Input
                prefix={<Mail size={16} style={{ color: 'var(--text-disabled)', marginRight: 4 }} />}
                value={profile?.email}
                disabled
                className="profile-readonly-input"
              />
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Email được dùng làm định danh bảo mật tài khoản và nhận liên kết khôi phục.
              </span>
            </Form.Item>

            <Form.Item
              name="fullName"
              label="Tên hiển thị"
              rules={[
                { required: true, message: 'Vui lòng nhập tên hiển thị' },
                { min: 2, max: 100, message: 'Tên hiển thị phải từ 2 đến 100 ký tự' },
                {
                  validator(_, value) {
                    if (value && value.trim().length < 2) {
                      return Promise.reject(new Error('Tên hiển thị phải chứa ít nhất 2 ký tự hợp lệ'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
              extra={
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Tên này sẽ được hiển thị khi bạn sử dụng các tính năng trên PSYTHALIA (bạn không bắt buộc phải dùng họ tên thật).
                </span>
              }
            >
              <Input
                prefix={<User size={16} style={{ color: 'var(--text-disabled)', marginRight: 4 }} />}
                placeholder="VD: An Nhiên, Minh Trí..."
                maxLength={100}
              />
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
              extra={
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Dùng để hỗ trợ xác minh khi cần thiết (tùy chọn), hoàn toàn bảo mật và không công khai.
                </span>
              }
            >
              <Input
                prefix={<Phone size={16} style={{ color: 'var(--text-disabled)', marginRight: 4 }} />}
                placeholder="0912345678 (tùy chọn)"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 12 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={updatingProfile}
                disabled={updatingProfile}
                className="profile-submit-btn"
              >
                {updatingProfile ? 'Đang lưu thay đổi...' : 'Lưu thay đổi hồ sơ'}
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Card 2: Đổi mật khẩu */}
        <Card
          className="profile-card"
          title={
            <div className="profile-card-header">
              <div className="profile-card-header__icon profile-card-header__icon--security">
                <KeyRound size={18} />
              </div>
              <span>Bảo mật & Đổi mật khẩu</span>
            </div>
          }
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
                prefix={<Lock size={16} style={{ color: 'var(--text-disabled)', marginRight: 4 }} />}
                placeholder="Nhập mật khẩu hiện tại"
              />
            </Form.Item>

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
                prefix={<Lock size={16} style={{ color: 'var(--text-disabled)', marginRight: 4 }} />}
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
                prefix={<Lock size={16} style={{ color: 'var(--text-disabled)', marginRight: 4 }} />}
                placeholder="Nhập lại mật khẩu mới"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 12 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={changingPassword}
                disabled={changingPassword}
                className="profile-submit-btn"
                style={{
                  background: 'var(--color-warning)',
                  borderColor: 'var(--color-warning)',
                  color: '#FFFFFF',
                }}
              >
                {changingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};