import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Tag, Switch, Alert, Table, message, Typography, Modal, Form, Input } from 'antd';
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

const { Title, Text } = Typography;

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

    loadData();
    return () => {
      isMounted = false;
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
      fetchVolunteerData();
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
        <Tag color={PRIORITY_COLOR_MAP[level] || 'default'}>
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
          <span style={{ fontSize: '13px' }}>
            {new Date(timeStr).toLocaleTimeString('vi-VN')} ({new Date(timeStr).toLocaleDateString('vi-VN')})
          </span>
        ) : (
          <Text type="secondary">Vừa xong</Text>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: () => <Tag color="blue">Đang đợi TNV</Tag>,
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
          style={{ background: '#10b981', borderColor: '#10b981' }}
        >
          Tiếp nhận ca này
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Volunteer Profile & Shift Banner */}
      <div
        style={{
          padding: '24px 28px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.06) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <HeartHandshake size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <Title level={4} style={{ margin: 0, color: 'var(--text-h)' }}>
                Bàn trực Tình nguyện viên: {user?.fullName}
              </Title>
              {profile?.isVerified ? (
                <Tag color="success" icon={<ShieldCheck size={12} />}>
                  Đã xác minh chính thức
                </Tag>
              ) : (
                <Tag color="warning" icon={<Clock size={12} />}>
                  Chờ duyệt lại hồ sơ
                </Tag>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text)' }}>
              Chuyên môn: <strong style={{ color: 'var(--text-h)' }}>{profile?.specialization || 'Tư vấn tâm lý chung'}</strong> • Sẵn sàng đồng hành cùng sinh viên.
            </p>
            {profile?.bio && (
              <p
                style={{
                  margin: '6px 0 0 0',
                  fontSize: '13px',
                  color: 'var(--text)',
                  maxWidth: '650px',
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                }}
              >
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
                    color: 'var(--accent)',
                    fontWeight: 500,
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'var(--bg)',
            padding: '10px 18px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
          }}
        >
          <Activity size={18} color={isOnline ? '#10b981' : 'var(--text)'} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-h)' }}>
              {isOnline ? 'Đang trực tuyến' : 'Đang ngoại tuyến'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text)' }}>
              {isOnline ? 'Nhận ca hỗ trợ' : 'Nghỉ ngơi'}
            </div>
          </div>
          <Switch
            checked={isOnline}
            disabled={!profile?.isVerified}
            loading={togglingOnline}
            onChange={handleToggleOnline}
            style={{ marginLeft: '8px' }}
          />
        </div>
      </div>

      {/* Cảnh báo hồ sơ chờ duyệt lại */}
      {!profile?.isVerified && (
        <Alert
          type="warning"
          showIcon
          icon={<Clock size={20} />}
          message={<strong>Hồ sơ đang chờ Quản trị viên duyệt lại</strong>}
          description="Bạn vừa cập nhật thông tin chuyên môn hoặc chứng chỉ. Để đảm bảo an toàn cho người dùng, hệ thống tạm thời khóa tính năng nhận phiên trực tuyến cho đến khi Quản trị viên đối soát xong."
        />
      )}

      {/* Critical Alert Banner if high risk waiting */}
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
              style={{ fontWeight: 600 }}
            >
              Vào phòng tư vấn ngay
            </Button>
          }
        />
      )}

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Card style={{ borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                Hàng đợi sinh viên
              </Text>
              <Title level={2} style={{ margin: '4px 0 0 0', color: 'var(--text-h)' }}>
                {waitingSessions.length}
              </Title>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
              }}
            >
              <Users size={22} />
            </div>
          </div>
          <Text style={{ fontSize: '12px', color: 'var(--text)' }}>Số ca đang chờ hỗ trợ</Text>
        </Card>

        <Card style={{ borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                Ca khẩn cấp (Critical)
              </Text>
              <Title level={2} style={{ margin: '4px 0 0 0', color: '#ef4444' }}>
                {criticalCount}
              </Title>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
              }}
            >
              <AlertTriangle size={22} />
            </div>
          </div>
          <Text style={{ fontSize: '12px', color: 'var(--text)' }}>Cần ưu tiên xử lý lập tức</Text>
        </Card>

        <Card style={{ borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                Ca ưu tiên cao (High)
              </Text>
              <Title level={2} style={{ margin: '4px 0 0 0', color: '#f59e0b' }}>
                {highCount}
              </Title>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f59e0b',
              }}
            >
              <Clock size={22} />
            </div>
          </div>
          <Text style={{ fontSize: '12px', color: 'var(--text)' }}>Mức độ lo âu / trầm cảm nặng</Text>
        </Card>

        <Card style={{ borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Text type="secondary" style={{ fontSize: '13px' }}>
                Phòng tư vấn trực tiếp
              </Text>
              <div style={{ marginTop: '6px' }}>
                <Button
                  type="primary"
                  icon={<MessageSquare size={16} />}
                  onClick={() => navigate('/chat')}
                  style={{ background: 'var(--accent)', borderColor: 'var(--accent)' }}
                >
                  Mở phòng chat
                </Button>
              </div>
            </div>
          </div>
          <Text style={{ fontSize: '12px', color: 'var(--text)', marginTop: '8px', display: 'block' }}>
            Xem giao diện tư vấn 1-1
          </Text>
        </Card>
      </div>

      {/* Main Content Grid: Waiting Queue + Guidelines */}
      <div className="dashboard-split-grid">
        {/* Waiting Queue Table */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '16px', fontWeight: 600 }}>Hàng đợi sinh viên chờ hỗ trợ</span>
              <Button size="small" icon={<RefreshCw size={13} />} onClick={fetchVolunteerData}>
                Làm mới
              </Button>
            </div>
          }
          style={{ borderRadius: '12px', border: '1px solid var(--border)' }}
        >
          {waitingSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
              <Text strong style={{ color: 'var(--text-h)' }}>
                Hiện không có sinh viên nào trong hàng đợi
              </Text>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                Hệ thống đang hoạt động ổn định. Khi có sinh viên gửi yêu cầu, danh sách sẽ hiển thị tại đây.
              </p>
            </div>
          ) : (
            <Table
              dataSource={waitingSessions}
              columns={queueColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              scroll={{ x: 750 }}
              size="middle"
            />
          )}
        </Card>

        {/* Volunteer Guidelines & Emergency Protocols */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card
            title="Quy tắc an toàn & Can thiệp"
            style={{ borderRadius: '12px', border: '1px solid var(--border)' }}
          >
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--text)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <strong style={{ color: 'var(--text-h)' }}>Lắng nghe thấu cảm:</strong> Không phán xét, tạo không gian an toàn để sinh viên chia sẻ.
              </li>
              <li>
                <strong style={{ color: 'var(--text-h)' }}>Bảo mật danh tính:</strong> Tuyệt đối không tiết lộ thông tin cá nhân của người được tư vấn ra ngoài hệ thống.
              </li>
              <li>
                <strong style={{ color: 'var(--text-h)' }}>Xử lý nguy cơ tự hại:</strong> Khi nhận thấy ý định tự sát, hãy ngay lập tức cung cấp số Hotline và giữ liên lạc.
              </li>
            </ul>

            <div
              style={{
                marginTop: '16px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <PhoneCall size={18} color="#ef4444" />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#ef4444' }}>
                  Hotline Hỗ trợ Khẩn cấp
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-h)' }}>
                  {import.meta.env.VITE_EMERGENCY_HOTLINE || '1900 6789'}
                </div>
              </div>
            </div>
          </Card>

          <Card
            title="Tài nguyên hỗ trợ sinh viên"
            style={{ borderRadius: '12px', border: '1px solid var(--border)' }}
          >
            <p style={{ fontSize: '13px', color: 'var(--text)', margin: '0 0 12px 0' }}>
              Bạn có thể hướng dẫn sinh viên sử dụng các bài tập thở hoặc tài nguyên thư giãn đã được tích hợp sẵn:
            </p>
            <Button
              block
              onClick={() => navigate('/resources')}
              icon={<ExternalLink size={14} />}
              style={{ fontSize: '13px' }}
            >
              Xem kho tài nguyên thư giãn
            </Button>
          </Card>
        </div>
      </div>

      {/* Modal Cập nhật hồ sơ TNV (PB-28) */}
      <Modal
        title="Cập nhật hồ sơ Tình nguyện viên"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        destroyOnClose
        centered
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateProfile}
          style={{ marginTop: '16px' }}
        >
          <Alert
            type="info"
            showIcon
            message="Lưu ý về kiểm duyệt chuyên môn"
            description="Nếu bạn thay đổi Chuyên môn hoặc Đường dẫn chứng chỉ, hồ sơ sẽ tự động chuyển sang trạng thái Chờ duyệt lại bởi Quản trị viên để đảm bảo an toàn cho sinh viên. Việc chỉ sửa Lời giới thiệu (Bio) sẽ có hiệu lực ngay lập tức."
            style={{ marginBottom: '16px', fontSize: '13px' }}
          />
          <Form.Item
            label="Chuyên môn / Học vấn"
            name="specialization"
            rules={[
              { required: true, message: 'Vui lòng nhập chuyên môn' },
              { max: 255, message: 'Tối đa 255 ký tự' },
            ]}
          >
            <Input placeholder="VD: Cử nhân Tâm lý học, Tham vấn viên..." />
          </Form.Item>

          <Form.Item
            label="Giới thiệu bản thân & Kinh nghiệm"
            name="bio"
            rules={[
              { required: true, message: 'Vui lòng viết đôi nét giới thiệu' },
              { max: 1000, message: 'Tối đa 1000 ký tự' },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Chia sẻ kinh nghiệm tư vấn hoặc phương châm hỗ trợ của bạn..."
            />
          </Form.Item>

          <Form.Item
            label="Đường dẫn chứng chỉ / Bằng cấp chuyên môn"
            name="certificateUrl"
            rules={[{ max: 500, message: 'Tối đa 500 ký tự' }]}
          >
            <Input placeholder="https://drive.google.com/... hoặc link ảnh chứng chỉ" />
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
            <Button onClick={() => setIsEditModalOpen(false)}>
              Huỷ
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={updatingProfile}
              style={{ background: 'var(--accent)', borderColor: 'var(--accent)' }}
            >
              Lưu thay đổi
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
