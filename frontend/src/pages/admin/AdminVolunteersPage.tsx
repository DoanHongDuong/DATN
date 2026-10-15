import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Popconfirm, message, Card, Typography } from 'antd';
import { ExternalLink, Check, X, RefreshCw, UserCheck } from 'lucide-react';
import { adminApi, type PendingVolunteer } from '../../api/admin.api';
import { AdminHeaderNav } from './AdminHeaderNav';
import axios, { AxiosError } from 'axios';

const { Text } = Typography;

export const AdminVolunteersPage: React.FC = () => {
  const [volunteers, setVolunteers] = useState<PendingVolunteer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchPendingVolunteers = useCallback(async () => {
    try {
      const data = await adminApi.getPendingVolunteers();
      setVolunteers(data);
    } catch (err: unknown) {
      console.error('Failed to fetch pending volunteers:', err);
      let msg = 'Không thể tải danh sách hồ sơ tình nguyện viên';
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        msg = axiosErr.response?.data?.message || msg;
      }
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await adminApi.getPendingVolunteers();
        if (isMounted) {
          setVolunteers(data);
        }
      } catch (err: unknown) {
        console.error('Failed to load pending volunteers:', err);
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

  const handleApprove = async (profileId: string) => {
    setActionId(profileId);
    try {
      const res = await adminApi.approveVolunteer(profileId);
      message.success(res.message || 'Phê duyệt tình nguyện viên thành công!');
      fetchPendingVolunteers();
    } catch (err: unknown) {
      let msg = 'Phê duyệt thất bại';
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        msg = axiosErr.response?.data?.message || msg;
      }
      message.error(msg);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (profileId: string) => {
    setActionId(profileId);
    try {
      const res = await adminApi.rejectVolunteer(profileId);
      message.success(res.message || 'Đã từ chối và xoá hồ sơ tình nguyện viên!');
      fetchPendingVolunteers();
    } catch (err: unknown) {
      let msg = 'Từ chối thất bại';
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        msg = axiosErr.response?.data?.message || msg;
      }
      message.error(msg);
    } finally {
      setActionId(null);
    }
  };

  const columns = [
    {
      title: 'Họ và tên',
      key: 'fullName',
      width: 170,
      render: (_: unknown, record: PendingVolunteer) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-h)' }}>{record.user?.fullName}</div>
          <div style={{ fontSize: '12px', color: 'var(--text)' }}>ID: {record.id.slice(0, 8)}...</div>
        </div>
      ),
    },
    {
      title: 'Email',
      key: 'email',
      width: 220,
      ellipsis: true,
      render: (_: unknown, record: PendingVolunteer) => (
        <Text copyable={{ text: record.user?.email }} ellipsis={{ tooltip: record.user?.email }}>
          {record.user?.email}
        </Text>
      ),
    },
    {
      title: 'Chuyên môn',
      dataIndex: 'specialization',
      key: 'specialization',
      width: 180,
      ellipsis: true,
      render: (spec: string | null) => (
        <span style={{ fontWeight: 500 }} title={spec || ''}>
          {spec || 'Chưa cập nhật'}
        </span>
      ),
    },
    {
      title: 'Giới thiệu / Kinh nghiệm',
      dataIndex: 'bio',
      key: 'bio',
      width: 220,
      ellipsis: true,
      render: (bio: string | null) => (
        <span title={bio || ''} style={{ fontSize: '13px' }}>
          {bio || 'Không có mô tả'}
        </span>
      ),
    },
    {
      title: 'Chứng chỉ / Bằng cấp',
      dataIndex: 'certificateUrl',
      key: 'certificateUrl',
      width: 160,
      render: (url: string | null) => {
        if (!url) {
          return <span style={{ color: 'var(--text)', fontSize: '12px' }}>Không có</span>;
        }
        return (
          <a
            href={url}
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
            <span>Xem chứng chỉ</span>
            <ExternalLink size={14} />
          </a>
        );
      },
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (dateStr: string) => (
        <span style={{ fontSize: '13px', color: 'var(--text)' }}>
          {new Date(dateStr).toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, record: PendingVolunteer) => {
        const isBusy = actionId === record.id;
        return (
          <Space>
            <Popconfirm
              title="Phê duyệt tình nguyện viên?"
              description={`Xác nhận phê duyệt cho ${record.user?.fullName} làm Tình nguyện viên?`}
              onConfirm={() => handleApprove(record.id)}
              okText="Đồng ý duyệt"
              cancelText="Huỷ"
              okButtonProps={{ loading: isBusy }}
            >
              <Button
                type="primary"
                size="small"
                icon={<Check size={14} />}
                loading={isBusy}
                style={{ background: '#10b981', borderColor: '#10b981' }}
              >
                Duyệt
              </Button>
            </Popconfirm>

            <Popconfirm
              title="Từ chối hồ sơ?"
              description={`Bạn có chắc muốn từ chối hồ sơ của ${record.user?.fullName}? Hồ sơ sẽ bị xoá và người dùng có thể nộp lại.`}
              onConfirm={() => handleReject(record.id)}
              okText="Từ chối hồ sơ"
              okType="danger"
              cancelText="Huỷ"
              okButtonProps={{ loading: isBusy }}
            >
              <Button
                danger
                size="small"
                icon={<X size={14} />}
                loading={isBusy}
              >
                Từ chối
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <AdminHeaderNav />

      <Card
        style={{
          borderRadius: '12px',
          border: '1px solid var(--border)',
          background: 'var(--bg)',
          overflow: 'hidden',
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={18} color="var(--accent)" />
            <span>Danh sách Hồ sơ đang chờ phê duyệt ({volunteers.length})</span>
          </div>
        }
        extra={
          <Button
            icon={<RefreshCw size={14} />}
            loading={loading}
            onClick={fetchPendingVolunteers}
          >
            Làm mới
          </Button>
        }
      >
        <Table
          dataSource={volunteers}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1050 }}
          locale={{
            emptyText: 'Hiện không có hồ sơ tình nguyện viên nào đang chờ duyệt.',
          }}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};
