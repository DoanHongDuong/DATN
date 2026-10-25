import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Tag, Switch, Alert, Table, message, Typography } from 'antd';
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
} from 'lucide-react';
import { chatApi, type ChatSession, type PriorityLevel } from '../../api/chat.api';
import { volunteerApi, type VolunteerProfile } from '../../api/volunteer.api';
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Title level={4} style={{ margin: 0, color: 'var(--text-h)' }}>
                Bàn trực Tình nguyện viên: {user?.fullName}
              </Title>
              {profile?.isVerified ? (
                <Tag color="success" icon={<ShieldCheck size={12} />}>
                  Đã xác minh chính thức
                </Tag>
              ) : (
                <Tag color="warning">Chờ duyệt hồ sơ</Tag>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text)' }}>
              Chuyên môn: <strong style={{ color: 'var(--text-h)' }}>{profile?.specialization || 'Tư vấn tâm lý chung'}</strong> • Sẵn sàng đồng hành cùng sinh viên.
            </p>
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
            loading={togglingOnline}
            onChange={handleToggleOnline}
            style={{ marginLeft: '8px' }}
          />
        </div>
      </div>

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
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
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
                  1900 6006 • 115
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
    </div>
  );
};
