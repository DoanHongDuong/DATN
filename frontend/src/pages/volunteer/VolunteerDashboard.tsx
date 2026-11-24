import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tag, Switch, Alert, Table, message, Modal, Form, Input } from 'antd';
import {
  MessageSquare,
  Users,
  AlertTriangle,
  Clock,
  ShieldCheck,
  PhoneCall,
  Activity,
  HeartHandshake,
  RefreshCw,
  ExternalLink,
  Edit3,
} from 'lucide-react';
import axios, { AxiosError } from 'axios';
import { chatApi, type ChatSession, type PriorityLevel } from '../../api/chat.api';
import { volunteerApi, type VolunteerProfile, type UpdateVolunteerProfilePayload } from '../../api/volunteer.api';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { getEmergencyHotline } from '../../utils/hotline';
import './volunteer.css';

const PRIORITY_COLOR_MAP: Record<PriorityLevel, string> = {
  CRITICAL: 'error',
  HIGH: 'warning',
  MEDIUM: 'processing',
  LOW: 'success',
};

const PRIORITY_LABEL_MAP: Record<PriorityLevel, string> = {
  CRITICAL: 'Rất cao (Critical)',
  HIGH: 'Cao (High)',
  MEDIUM: 'Trung bình (Medium)',
  LOW: 'Thấp (Low)',
};

export const VolunteerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<VolunteerProfile | null>(null);
  const [waitingSessions, setWaitingSessions] = useState<ChatSession[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [togglingOnline, setTogglingOnline] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  // State cho Modal Cập nhật hồ sơ TNV (PB-28)
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [updatingProfile, setUpdatingProfile] = useState<boolean>(false);
  const [editForm] = Form.useForm<UpdateVolunteerProfilePayload>();

  const handleOpenEditModal = () => {
    editForm.setFieldsValue({
      specialization: profile?.specialization || '',
      bio: profile?.bio || '',
      certificateUrl: profile?.certificateUrl || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateProfile = async (values: UpdateVolunteerProfilePayload) => {
    setUpdatingProfile(true);
    try {
      const res = await volunteerApi.updateProfile({
        specialization: values.specialization?.trim(),
        bio: values.bio?.trim(),
        certificateUrl: values.certificateUrl?.trim() || undefined,
      });
      setProfile(res.profile);
      if (res.requiresReverification) {
        setIsOnline(false);
        message.warning(res.message);
      } else {
        message.success(res.message);
      }
      setIsEditModalOpen(false);
    } catch (err: unknown) {
      let msg = 'Không thể cập nhật hồ sơ tình nguyện viên';
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        msg = axiosErr.response?.data?.message || msg;
      }
      message.error(msg);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const fetchVolunteerData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileData, queueData] = await Promise.all([
        volunteerApi.getMyProfile().catch(() => null),
        chatApi.getWaitingSessions().catch(() => []),
      ]);
      setProfile(profileData);
      setIsOnline(profileData?.isOnline || false);
      setWaitingSessions(queueData);
    } catch (err) {
      console.error('Failed to fetch volunteer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [profileData, queueData] = await Promise.all([
          volunteerApi.getMyProfile().catch(() => null),
          chatApi.getWaitingSessions().catch(() => []),
        ]);
        if (isMounted) {
          setProfile(profileData);
          setIsOnline(profileData?.isOnline || false);
          setWaitingSessions(queueData);
        }
      } catch (err) {
        console.error('Failed to fetch volunteer dashboard data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleQueueUpdate = () => {
      chatApi
        .getWaitingSessions()
        .then((queueData) => setWaitingSessions(queueData || []))
        .catch((err) => console.error('Failed to auto-refresh queue:', err));
    };

    window.addEventListener('waiting_queue_updated', handleQueueUpdate);
    return () => {
      window.removeEventListener('waiting_queue_updated', handleQueueUpdate);
    };
  }, []);

  const handleToggleOnline = async (checked: boolean) => {
    setTogglingOnline(true);
    try {
      const updated = await volunteerApi.updateOnlineStatus(checked);
      setIsOnline(updated.isOnline);
      message.success(
        updated.isOnline
          ? 'Bạn đang trực tuyến và sẵn sàng tiếp nhận sinh viên hỗ trợ!'
          : 'Bạn đã chuyển sang trạng thái ngoại tuyến / nghỉ ca.',
      );
    } catch {
      message.error('Không thể cập nhật trạng thái trực tuyến');
    } finally {
      setTogglingOnline(false);
    }
  };

  const handleAcceptSession = async (sessionId: string) => {
    setAcceptingId(sessionId);
    try {
      await chatApi.acceptSession(sessionId);
      message.success('Đã tiếp nhận phiên tư vấn thành công! Đang chuyển đến phòng chat...');
      navigate('/chat');
    } catch {
      message.error('Không thể tiếp nhận phiên. Có thể phiên đã được TNV khác nhận.');
      void fetchVolunteerData();
    } finally {
      setAcceptingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Đang tải dữ liệu bàn làm việc Tình nguyện viên..." />;
  }

  const criticalCount = waitingSessions.filter((s) => s.priorityLevel === 'CRITICAL').length;
  const highCount = waitingSessions.filter((s) => s.priorityLevel === 'HIGH').length;

  const queueColumns = [
    {
      title: 'Mức độ ưu tiên',
      dataIndex: 'priorityLevel',
      key: 'priorityLevel',
      render: (level: PriorityLevel) => (
        <Tag color={PRIORITY_COLOR_MAP[level] || 'default'} style={{ borderRadius: '6px', fontWeight: 600 }}>
          {PRIORITY_LABEL_MAP[level] || level}
        </Tag>
      ),
    },
    {
      title: 'Thời gian gửi yêu cầu',
      dataIndex: 'queuedAt',
      key: 'queuedAt',
      render: (date?: string, record?: ChatSession) => {
        const timeStr = date || record?.createdAt;
        return timeStr ? (
          <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
            {new Date(timeStr).toLocaleTimeString('vi-VN')} ({new Date(timeStr).toLocaleDateString('vi-VN')})
          </span>
        ) : (
          <span style={{ color: 'var(--text-secondary)' }}>Vừa xong</span>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: () => <Tag color="blue" style={{ borderRadius: '6px' }}>Đang đợi TNV</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: unknown, record: ChatSession) => (
        <Button
          type="primary"
          size="small"
          loading={acceptingId === record.id}
          onClick={() => handleAcceptSession(record.id)}
          style={{ borderRadius: '6px', fontWeight: 600 }}
        >
          Tiếp nhận ca này
        </Button>
      ),
    },
  ];

  return (
    <div className="volunteer-dashboard-container">
      {/* ─── 1. Volunteer Profile & Shift Banner ─── */}
      <div className="volunteer-shift-banner">
        <div className="volunteer-shift-banner__left">
          <div className="volunteer-shift-banner__avatar">
            <HeartHandshake size={28} />
          </div>
          <div>
            <div className="volunteer-shift-banner__title-row">
              <h1 className="volunteer-shift-banner__title">
                Bàn trực Tình nguyện viên: {user?.fullName}
              </h1>
              {profile?.isVerified ? (
                <Tag color="success" icon={<ShieldCheck size={12} />} style={{ borderRadius: '6px', fontWeight: 600 }}>
                  Đã xác minh chính thức
                </Tag>
              ) : (
                <Tag color="warning" icon={<Clock size={12} />} style={{ borderRadius: '6px', fontWeight: 600 }}>
                  Chờ duyệt lại hồ sơ
                </Tag>
              )}
            </div>
            <p className="volunteer-shift-banner__meta">
              Chuyên môn: <strong style={{ color: 'var(--text-primary)' }}>{profile?.specialization || 'Tư vấn tâm lý chung'}</strong> • Sẵn sàng đồng hành cùng sinh viên.
            </p>
            {profile?.bio && (
              <p className="volunteer-shift-banner__bio">
                "{profile.bio}"
              </p>
            )}
            {profile?.certificateUrl && (
              <div style={{ marginTop: '6px' }}>
                <a
                  href={profile.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: 'var(--color-primary)',
                    fontWeight: 600,
                  }}
                >
                  <ExternalLink size={12} />
                  <span>Xem tài liệu / chứng chỉ chuyên môn</span>
                </a>
              </div>
            )}
            <div style={{ marginTop: '10px' }}>
              <Button
                size="small"
                icon={<Edit3 size={13} />}
                onClick={handleOpenEditModal}
                style={{ fontSize: '12px', borderRadius: '6px' }}
              >
                Cập nhật thông tin chuyên môn
              </Button>
            </div>
          </div>
        </div>

        {/* Shift online toggle */}
        <div className="volunteer-shift-toggle-box">
          <Activity size={20} color={isOnline ? 'var(--color-success)' : 'var(--text-secondary)'} />
          <div>
            <div className="volunteer-shift-toggle-status">
              {isOnline ? 'Đang trực tuyến' : 'Đang ngoại tuyến'}
            </div>
            <div className="volunteer-shift-toggle-sub">
              {isOnline ? 'Sẵn sàng nhận ca' : 'Nghỉ ca'}
            </div>
          </div>
          <Switch
            checked={isOnline}
            disabled={!profile?.isVerified}
            loading={togglingOnline}
            onChange={handleToggleOnline}
            style={{ marginLeft: '6px' }}
          />
        </div>
      </div>

      {/* ─── 2. Cảnh báo hồ sơ chờ duyệt lại ─── */}
      {!profile?.isVerified && (
        <Alert
          type="warning"
          showIcon
          icon={<Clock size={20} />}
          message={<strong>Hồ sơ đang chờ Quản trị viên duyệt lại</strong>}
          description="Bạn vừa cập nhật thông tin chuyên môn hoặc chứng chỉ. Để đảm bảo an toàn cho sinh viên, hệ thống tạm thời khóa tính năng nhận phiên trực tuyến cho đến khi Quản trị viên đối soát xong."
          style={{ borderRadius: '12px' }}
        />
      )}

      {/* ─── 3. Critical Alert Banner if high risk waiting ─── */}
      {criticalCount > 0 && (
        <Alert
          type="error"
          showIcon
          icon={<AlertTriangle size={20} />}
          message={
            <strong>
              Cảnh báo khẩn cấp: Đang có {criticalCount} sinh viên ở mức độ RẤT CAO (Critical) chờ hỗ trợ!
            </strong>
          }
          description="Vui lòng kiểm tra hàng đợi bên dưới hoặc vào phòng tư vấn trực tiếp ngay để đồng hành và hỗ trợ can thiệp kịp thời."
          action={
            <Button
              danger
              type="primary"
              onClick={() => navigate('/chat')}
              style={{ fontWeight: 600, borderRadius: '8px' }}
            >
              Vào phòng tư vấn ngay
            </Button>
          }
          style={{ borderRadius: '12px' }}
        />
      )}

      {/* ─── 4. Metrics Grid ─── */}
      <div className="volunteer-metrics-grid">
        <div className="volunteer-metric-card">
          <div className="volunteer-metric-card__header">
            <div>
              <div className="volunteer-metric-card__label">Hàng đợi sinh viên</div>
              <div className="volunteer-metric-card__val" style={{ color: 'var(--text-primary)' }}>
                {waitingSessions.length}
              </div>
            </div>
            <div className="volunteer-metric-card__icon" style={{ background: 'var(--tint-blue)', color: 'var(--color-info)' }}>
              <Users size={22} />
            </div>
          </div>
          <div className="volunteer-metric-card__subtext">Số ca đang chờ hỗ trợ</div>
        </div>

        <div className="volunteer-metric-card">
          <div className="volunteer-metric-card__header">
            <div>
              <div className="volunteer-metric-card__label">Ca khẩn cấp (Critical)</div>
              <div className="volunteer-metric-card__val" style={{ color: 'var(--color-crisis)' }}>
                {criticalCount}
              </div>
            </div>
            <div className="volunteer-metric-card__icon" style={{ background: 'var(--tint-crimson)', color: 'var(--color-crisis)' }}>
              <AlertTriangle size={22} />
            </div>
          </div>
          <div className="volunteer-metric-card__subtext">Cần ưu tiên can thiệp lập tức</div>
        </div>

        <div className="volunteer-metric-card">
          <div className="volunteer-metric-card__header">
            <div>
              <div className="volunteer-metric-card__label">Ca ưu tiên cao (High)</div>
              <div className="volunteer-metric-card__val" style={{ color: 'var(--color-warning)' }}>
                {highCount}
              </div>
            </div>
            <div className="volunteer-metric-card__icon" style={{ background: 'var(--tint-terracotta)', color: 'var(--color-warning)' }}>
              <Clock size={22} />
            </div>
          </div>
          <div className="volunteer-metric-card__subtext">Mức độ căng thẳng / lo âu nặng</div>
        </div>

        <div className="volunteer-metric-card">
          <div className="volunteer-metric-card__header">
            <div>
              <div className="volunteer-metric-card__label">Phòng tư vấn trực tiếp</div>
              <div style={{ marginTop: '8px' }}>
                <Button
                  type="primary"
                  icon={<MessageSquare size={16} />}
                  onClick={() => navigate('/chat')}
                  style={{ borderRadius: '8px', fontWeight: 600 }}
                >
                  Mở phòng chat
                </Button>
              </div>
            </div>
          </div>
          <div className="volunteer-metric-card__subtext">Xem giao diện tư vấn 1-1</div>
        </div>
      </div>

      {/* ─── 5. Main Content Split Grid ─── */}
      <div className="volunteer-split-grid">
        {/* Waiting Queue Table Card */}
        <div className="volunteer-card">
          <div className="volunteer-card__title-row">
            <h2 className="volunteer-card__title">
              Hàng đợi sinh viên chờ hỗ trợ
            </h2>
            <Button size="small" icon={<RefreshCw size={13} />} onClick={fetchVolunteerData} style={{ borderRadius: '6px' }}>
              Làm mới
            </Button>
          </div>

          {waitingSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌱</div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                Hiện không có sinh viên nào trong hàng đợi
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                Hệ thống đang hoạt động ổn định. Khi có sinh viên gửi yêu cầu, danh sách sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            <Table
              dataSource={waitingSessions}
              columns={queueColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              scroll={{ x: 700 }}
              size="middle"
            />
          )}
        </div>

        {/* Volunteer Guidelines & Emergency Protocols */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="volunteer-card">
            <h2 className="volunteer-card__title" style={{ marginBottom: '14px' }}>
              Quy tắc an toàn & Can thiệp
            </h2>
            <div className="volunteer-guidelines-box">
              <div className="volunteer-guidelines-item">
                <strong>Lắng nghe thấu cảm:</strong> Không phán xét, tạo không gian an toàn để sinh viên trải lòng.
              </div>
              <div className="volunteer-guidelines-item">
                <strong>Bảo mật danh tính:</strong> Tuyệt đối không tiết lộ thông tin cá nhân của người được tư vấn ra ngoài hệ thống.
              </div>
              <div className="volunteer-guidelines-item">
                <strong>Xử lý nguy cơ tự hại:</strong> Khi nhận thấy ý định tự sát, hãy ngay lập tức cung cấp số Hotline và giữ liên lạc.
              </div>
            </div>

            <div className="volunteer-emergency-strip">
              <PhoneCall size={20} color="var(--color-crisis)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-crisis)' }}>
                  Hotline Hỗ trợ Khẩn cấp 24/7
                </div>
                <div className="volunteer-emergency-strip__number">
                  {getEmergencyHotline()}
                </div>
              </div>
            </div>
          </div>

          <div className="volunteer-card">
            <h2 className="volunteer-card__title" style={{ marginBottom: '12px' }}>
              Tài nguyên hỗ trợ sinh viên
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '0 0 14px', lineHeight: 1.55 }}>
              Bạn có thể hướng dẫn sinh viên sử dụng các bài tập thở hoặc tài nguyên thư giãn đã được tích hợp sẵn:
            </p>
            <Button
              block
              onClick={() => navigate('/resources')}
              style={{ borderRadius: '8px', fontWeight: 600 }}
            >
              Mở kho bài tập thư giãn
            </Button>
          </div>
        </div>
      </div>

      {/* ─── 6. Modal Cập nhật Hồ sơ Chuyên môn (PB-28) ─── */}
      <Modal
        title="Cập nhật Hồ sơ Tình nguyện viên"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        destroyOnClose
        centered
        width={560}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateProfile}
          requiredMark={false}
          style={{ marginTop: '16px' }}
        >
          <Form.Item
            label="Lĩnh vực chuyên môn"
            name="specialization"
            rules={[{ required: true, message: 'Vui lòng nhập chuyên môn của bạn' }]}
          >
            <Input placeholder="Ví dụ: Tư vấn tâm lý học đường, Trị liệu nhận thức hành vi (CBT)..." />
          </Form.Item>

          <Form.Item
            label="Giới thiệu bản thân & Kinh nghiệm"
            name="bio"
            rules={[{ required: true, message: 'Vui lòng giới thiệu đôi nét về bản thân' }]}
          >
            <Input.TextArea
              rows={4}
              maxLength={500}
              showCount
              placeholder="Chia sẻ về kinh nghiệm lắng nghe, hỗ trợ cộng đồng của bạn..."
            />
          </Form.Item>

          <Form.Item
            label="Đường dẫn chứng chỉ / Bằng cấp chuyên môn (nếu có)"
            name="certificateUrl"
            rules={[{ type: 'url', message: 'Vui lòng nhập đường dẫn URL hợp lệ' }]}
          >
            <Input placeholder="https://example.com/certificate.pdf" />
          </Form.Item>

          <Alert
            type="info"
            showIcon
            message="Lưu ý về quy trình kiểm duyệt"
            description="Nếu bạn thay đổi đường dẫn chứng chỉ hoặc nội dung chuyên môn, hệ thống sẽ tự động chuyển hồ sơ về trạng thái chờ Quản trị viên duyệt lại để đảm bảo an toàn cho người dùng."
            style={{ marginBottom: '20px' }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button onClick={() => setIsEditModalOpen(false)} style={{ borderRadius: '8px' }}>
              Hủy
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={updatingProfile}
              style={{ borderRadius: '8px', fontWeight: 600 }}
            >
              Lưu thay đổi
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
