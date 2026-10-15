import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Alert, Result, message, Typography, Tag } from 'antd';
import { HeartHandshake, LogOut, CheckCircle2, Clock, ExternalLink, ArrowRight } from 'lucide-react';
import { volunteerApi, type VolunteerProfile, type ApplyVolunteerPayload } from '../../api/volunteer.api';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import axios, { AxiosError } from 'axios';

const { Paragraph } = Typography;

export const VolunteerApplyPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<VolunteerProfile | null>(null);
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
        }
      } catch (err) {
        console.error('Failed to load volunteer profile:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    load();
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
    navigate('/login');
  };

  if (loading) {
    return <LoadingSpinner message="Đang kiểm tra trạng thái hồ sơ tình nguyện viên..." />;
  }

  // TRƯỜNG HỢP 1: ĐÃ ĐƯỢC DUYỆT (isVerified === true)
  if (profile && profile.isVerified) {
    const isRoleActivated = user?.role === 'VOLUNTEER';

    return (
      <div style={{ maxWidth: '640px', margin: '40px auto' }}>
        <Card
          style={{
            borderRadius: '16px',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          }}
        >
          <Result
            status="success"
            icon={<CheckCircle2 size={64} color="#10b981" style={{ margin: '0 auto' }} />}
            title="Hồ sơ tình nguyện viên đã được phê duyệt! 🎉"
            subTitle={
              isRoleActivated
                ? 'Tài khoản của bạn đã được kích hoạt vai trò Tình nguyện viên. Bạn có thể sẵn sàng nhận các phiên hỗ trợ tâm lý.'
                : 'Chúc mừng bạn! Hồ sơ đã được quản trị viên duyệt thành công.'
            }
            extra={[
              !isRoleActivated ? (
                <div key="action-relogin" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                  <Alert
                    type="warning"
                    showIcon
                    message="Kích hoạt quyền Tình nguyện viên"
                    description="Đăng xuất và đăng nhập lại để kích hoạt vai trò tình nguyện viên trên phiên làm việc của bạn."
                    style={{ textAlign: 'left', width: '100%' }}
                  />
                  <Button
                    type="primary"
                    size="large"
                    icon={<LogOut size={16} />}
                    onClick={handleLogoutAndReLogin}
                    style={{ background: 'var(--accent)', minWidth: '220px' }}
                  >
                    Đăng xuất và đăng nhập lại
                  </Button>
                </div>
              ) : (
                <div key="action-goto-chat" style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<ArrowRight size={16} />}
                    onClick={() => navigate('/chat')}
                    style={{ background: '#10b981', borderColor: '#10b981' }}
                  >
                    Đến phòng tư vấn trực tuyến
                  </Button>
                </div>
              ),
            ]}
          />
        </Card>
      </div>
    );
  }

  // TRƯỜNG HỢP 2: ĐANG CHỜ DUYỆT (isVerified === false)
  if (profile && !profile.isVerified) {
    return (
      <div style={{ maxWidth: '640px', margin: '40px auto' }}>
        <Card
          style={{
            borderRadius: '16px',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#f59e0b',
              }}
            >
              <Clock size={36} />
            </div>
            <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-h)' }}>
              Hồ sơ đang chờ duyệt
            </h2>
            <p style={{ color: 'var(--text)', fontSize: '14px', margin: 0 }}>
              Hồ sơ của bạn đã được ghi nhận vào hệ thống và đang chờ Quản trị viên xem xét, phê duyệt.
            </p>
          </div>

          <Alert
            type="info"
            showIcon
            message="Thông báo tiếp nhận"
            description="Ban quản trị MindCare sẽ đối soát thông tin và chứng chỉ chuyên môn của bạn. Vui lòng quay lại kiểm tra trạng thái sau."
            style={{ marginBottom: '24px' }}
          />

          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'var(--code-bg)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text)' }}>Trạng thái:</span>
              <Tag color="processing">Đang chờ duyệt</Tag>
            </div>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text)', display: 'block', marginBottom: '4px' }}>
                Chuyên môn:
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>
                {profile.specialization}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '13px', color: 'var(--text)', display: 'block', marginBottom: '4px' }}>
                Giới thiệu bản thân:
              </span>
              <Paragraph style={{ margin: 0, fontSize: '13px', color: 'var(--text)' }}>
                {profile.bio}
              </Paragraph>
            </div>
            {profile.certificateUrl && (
              <div>
                <span style={{ fontSize: '13px', color: 'var(--text)', display: 'block', marginBottom: '4px' }}>
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
                    color: 'var(--accent)',
                    fontWeight: 500,
                    fontSize: '13px',
                  }}
                >
                  <span>Xem tài liệu đính kèm</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            )}
            <div style={{ fontSize: '12px', color: 'var(--text)', marginTop: '8px' }}>
              Ngày nộp: {new Date(profile.createdAt).toLocaleString('vi-VN')}
            </div>
          </div>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <Link to="/dashboard" style={{ fontSize: '14px', color: 'var(--accent)', fontWeight: 500 }}>
              ← Quay lại Trang tổng quan
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // TRƯỜNG HỢP 3: CHƯA NỘP HỒ SƠ (profile === null)
  return (
    <div style={{ maxWidth: '640px', margin: '40px auto' }}>
      <Card
        style={{
          borderRadius: '16px',
          border: '1px solid var(--border)',
          background: 'var(--bg)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(170, 59, 255, 0.2) 0%, rgba(107, 33, 168, 0.1) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--accent)',
            }}
          >
            <HeartHandshake size={32} />
          </div>
          <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-h)' }}>
            Đăng ký làm Tình nguyện viên MindCare
          </h2>
          <p style={{ color: 'var(--text)', fontSize: '14px', margin: 0 }}>
            Cùng chúng tôi lắng nghe, sẻ chia và đồng hành hỗ trợ tâm lý cho cộng đồng
          </p>
        </div>

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
            <Input placeholder="https://drive.google.com/... hoặc link ảnh chứng chỉ" />
          </Form.Item>

          <Form.Item style={{ marginTop: '24px', marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={submitting}
              style={{
                height: '46px',
                fontSize: '15px',
                fontWeight: 600,
                borderRadius: '8px',
                background: 'var(--accent)',
              }}
            >
              Gửi hồ sơ đăng ký
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
