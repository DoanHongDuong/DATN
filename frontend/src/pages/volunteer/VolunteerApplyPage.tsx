import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Alert, Result, message, Tag } from 'antd';
import { HeartHandshake, LogOut, CheckCircle2, Clock, ExternalLink, ArrowRight } from 'lucide-react';
import { volunteerApi, type VolunteerProfile, type ApplyVolunteerPayload } from '../../api/volunteer.api';
import { notificationApi } from '../../api/notification.api';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import axios, { AxiosError } from 'axios';
import './volunteer.css';

export const VolunteerApplyPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);
  const [rejectionNotice, setRejectionNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [form] = Form.useForm<ApplyVolunteerPayload>();

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await volunteerApi.getMyProfile();
        if (isMounted) {
          setProfile(data);
          // Nếu chưa có profile hoặc profile đã bị từ chối/xoá, kiểm tra thông báo từ chối gần nhất
          if (!data) {
            try {
              const notifRes = await notificationApi.getNotifications(1, 10);
              const rejectNotif = notifRes.notifications.find(
                (n) => n.type === 'VOLUNTEER_REJECTED'
              );
              if (rejectNotif && isMounted) {
                setRejectionNotice(rejectNotif.content);
              }
            } catch {
              // Ignore notification check error
            }
          }
        }
      } catch (err) {
        console.error('Failed to load volunteer profile:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (values: ApplyVolunteerPayload) => {
    setSubmitting(true);
    try {
      const newProfile = await volunteerApi.apply(values);
      message.success('Gửi hồ sơ đăng ký tình nguyện viên thành công!');
      setProfile(newProfile);
    } catch (err: unknown) {
      let msg = 'Gửi hồ sơ thất bại. Vui lòng thử lại.';
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        msg = axiosErr.response?.data?.message || msg;
      }
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoutAndReLogin = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return <LoadingSpinner message="Đang kiểm tra trạng thái hồ sơ tình nguyện viên..." />;
  }

  // TRƯỜNG HỢP 1: ĐÃ ĐƯỢC DUYỆT (isVerified === true)
  if (profile && profile.isVerified) {
    const isRoleActivated = user?.role === 'VOLUNTEER';

    return (
      <div className="volunteer-apply-card">
        <Result
          status="success"
          icon={<CheckCircle2 size={60} color="var(--color-success)" style={{ margin: '0 auto' }} />}
          title={
            <span style={{ fontFamily: 'var(--heading)', fontWeight: 700, color: 'var(--text-primary)' }}>
              Hồ sơ tình nguyện viên đã được phê duyệt! 🎉
            </span>
          }
          subTitle={
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {isRoleActivated
                ? 'Tài khoản của bạn đã được kích hoạt vai trò Tình nguyện viên. Bạn có thể sẵn sàng tiếp nhận các phiên hỗ trợ tâm lý.'
                : 'Chúc mừng bạn! Hồ sơ đã được ban quản trị phê duyệt thành công.'}
            </span>
          }
          extra={[
            !isRoleActivated ? (
              <div key="action-relogin" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                <Alert
                  type="warning"
                  showIcon
                  message="Kích hoạt quyền Tình nguyện viên"
                  description="Vui lòng đăng xuất và đăng nhập lại để cập nhật token phiên làm việc sang vai trò Tình nguyện viên."
                  style={{ textAlign: 'left', width: '100%', borderRadius: '10px' }}
                />
                <Button
                  type="primary"
                  size="large"
                  icon={<LogOut size={16} />}
                  onClick={handleLogoutAndReLogin}
                  style={{ minWidth: '220px', borderRadius: '8px', fontWeight: 600 }}
                >
                  Đăng xuất và đăng nhập lại
                </Button>
              </div>
            ) : (
              <div key="action-goto-chat" style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<ArrowRight size={16} />}
                  onClick={() => navigate('/chat')}
                  style={{ borderRadius: '8px', fontWeight: 600 }}
                >
                  Đến phòng tư vấn trực tuyến
                </Button>
                <Button
                  size="large"
                  onClick={() => navigate('/dashboard')}
                  style={{ borderRadius: '8px' }}
                >
                  Về Bàn trực TNV
                </Button>
              </div>
            ),
          ]}
        />
      </div>
    );
  }

  // TRƯỜNG HỢP 2: ĐANG CHỜ DUYỆT (isVerified === false)
  if (profile && !profile.isVerified) {
    return (
      <div className="volunteer-apply-card">
        <div className="volunteer-apply-header">
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'var(--tint-terracotta)',
              color: 'var(--color-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Clock size={32} />
          </div>
          <h1 className="volunteer-apply-title">
            Hồ sơ đang chờ duyệt
          </h1>
          <p className="volunteer-apply-desc">
            Hồ sơ của bạn đã được ghi nhận vào hệ thống và đang chờ Ban quản trị xem xét, phê duyệt.
          </p>
        </div>

        <Alert
          type="info"
          showIcon
          message="Thông báo tiếp nhận"
          description="Ban quản trị PSYTHALIA sẽ đối soát thông tin và chứng chỉ chuyên môn của bạn. Vui lòng quay lại kiểm tra trạng thái sau."
          style={{ marginBottom: '24px', borderRadius: '12px' }}
        />

        <div
          style={{
            padding: '18px 20px',
            borderRadius: '14px',
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Trạng thái:</span>
            <Tag color="processing" style={{ borderRadius: '6px', fontWeight: 600 }}>Đang chờ duyệt</Tag>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Chuyên môn:
            </span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14.5px' }}>
              {profile.specialization}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Giới thiệu bản thân:
            </span>
            <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
              {profile.bio}
            </p>
          </div>
          {profile.certificateUrl && (
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Chứng chỉ chuyên môn:
              </span>
              <a
                href={profile.certificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--color-primary)',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                <span>Xem tài liệu đính kèm</span>
                <ExternalLink size={14} />
              </a>
            </div>
          )}
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Ngày nộp: {new Date(profile.createdAt).toLocaleString('vi-VN')}
          </div>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link to="/dashboard" style={{ fontSize: '14px', color: 'var(--color-primary)', fontWeight: 600 }}>
            ← Quay lại Trang tổng quan
          </Link>
        </div>
      </div>
    );
  }

  // TRƯỜNG HỢP 3: CHƯA NỘP HỒ SƠ (profile === null)
  return (
    <div className="volunteer-apply-card">
      <div className="volunteer-apply-header">
        <div className="volunteer-apply-icon">
          <HeartHandshake size={30} />
        </div>
        <h1 className="volunteer-apply-title">
          Đăng ký làm Tình nguyện viên PSYTHALIA
        </h1>
        <p className="volunteer-apply-desc">
          Cùng chúng tôi lắng nghe, sẻ chia và đồng hành hỗ trợ tâm lý ban đầu cho cộng đồng sinh viên.
        </p>
      </div>

      {rejectionNotice && (() => {
        const match = rejectionNotice.match(/Lý do(?: từ chối)?:\s*(.*)/is);
        const reasonText = match && match[1] ? match[1].trim() : rejectionNotice;

        return (
          <Alert
            type="error"
            showIcon
            message={<span style={{ fontWeight: 700, fontSize: '14.5px' }}>Hồ sơ ứng tuyển trước đó chưa được duyệt</span>}
            description={
              <div style={{ marginTop: '8px' }}>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'var(--tint-crimson)',
                    border: '1px solid rgba(166, 50, 40, 0.25)',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--color-crisis)', fontSize: '13px', marginBottom: '4px' }}>
                    📌 Lý do từ chối từ Ban quản trị:
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.55 }}>
                    {reasonText}
                  </div>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  💡 Bạn có thể hoàn thiện thông tin, bổ sung chứng chỉ theo góp ý trên và nộp lại hồ sơ bên dưới.
                </div>
              </div>
            }
            style={{ marginBottom: '24px', borderRadius: '12px' }}
          />
        );
      })()}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark="optional"
        size="large"
      >
        <Form.Item
          label="Chuyên môn / Học vấn"
          name="specialization"
          rules={[
            { required: true, message: 'Vui lòng nhập chuyên môn của bạn' },
            { max: 255, message: 'Tối đa 255 ký tự' },
          ]}
        >
          <Input placeholder="VD: Cử nhân Tâm lý học, Sinh viên năm cuối ngành Công tác xã hội..." />
        </Form.Item>

        <Form.Item
          label="Giới thiệu bản thân & Kinh nghiệm hỗ trợ"
          name="bio"
          rules={[
            { required: true, message: 'Vui lòng viết đôi nét giới thiệu bản thân' },
            { max: 1000, message: 'Tối đa 1000 ký tự' },
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Chia sẻ về kinh nghiệm tham gia các hoạt động tư vấn, lắng nghe đồng đẳng, hoặc lý do bạn muốn trở thành tình nguyện viên..."
          />
        </Form.Item>

        <Form.Item
          label="Đường dẫn chứng chỉ / Bằng cấp chuyên môn (Nếu có)"
          name="certificateUrl"
          rules={[
            { max: 500, message: 'Tối đa 500 ký tự' },
          ]}
        >
          <Input placeholder="https://drive.google.com/... hoặc link tài liệu chứng chỉ" />
        </Form.Item>

        <Form.Item style={{ marginTop: '28px', marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={submitting}
            style={{
              height: '46px',
              fontSize: '15px',
              fontWeight: 600,
              borderRadius: '10px',
            }}
          >
            Gửi hồ sơ đăng ký
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
