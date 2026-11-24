import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Popconfirm, message, Card, Typography, Modal, Input, Alert, Tag } from 'antd';
import { ExternalLink, Check, X, RefreshCw, UserCheck, Clock, AlertCircle } from 'lucide-react';
import { adminApi, type PendingVolunteer } from '../../api/admin.api';
import { AdminHeaderNav } from './AdminHeaderNav';
import axios, { AxiosError } from 'axios';
import './admin.css';

const { Text } = Typography;

export const AdminVolunteersPage: React.FC = () => {
  const [volunteers, setVolunteers] = useState<PendingVolunteer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  // State cho Modal từ chối hồ sơ
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<PendingVolunteer | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState<boolean>(false);

  const fetchPendingVolunteers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getPendingVolunteers();
      setVolunteers(data);
    } catch (err: unknown) {
      console.error('Failed to fetch pending volunteers:', err);
      let msg = 'Không thể tải danh sách hồ sơ tình nguyện viên';
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        msg = axiosErr.response?.data?.message || msg;
      }
      setError(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setError(null);
        const data = await adminApi.getPendingVolunteers();
        if (isMounted) {
          setVolunteers(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Failed to load pending volunteers:', err);
          setError('Không thể tải danh sách hồ sơ tình nguyện viên. Vui lòng thử lại.');
        }
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

  const handleOpenRejectModal = (record: PendingVolunteer) => {
    setSelectedVolunteer(record);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedVolunteer) return;
    setIsRejecting(true);
    try {
      const res = await adminApi.rejectVolunteer(selectedVolunteer.id, rejectReason.trim() || undefined);
      message.success(res.message || 'Đã từ chối và xoá hồ sơ tình nguyện viên!');
      setRejectModalOpen(false);
      setSelectedVolunteer(null);
      setRejectReason('');
      fetchPendingVolunteers();
    } catch (err: unknown) {
      let msg = 'Từ chối thất bại';
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        msg = axiosErr.response?.data?.message || msg;
      }
      message.error(msg);
    } finally {
      setIsRejecting(false);
    }
  };

  const columns = [
    {
      title: 'Ứng viên',
      key: 'fullName',
      width: 180,
      render: (_: unknown, record: PendingVolunteer) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{record.user?.fullName}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--mono)' }}>
            ID: {record.id.slice(0, 8)}...
          </div>
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
      title: 'Trạng thái',
      key: 'status',
      width: 130,
      render: () => (
        <Tag color="warning" className="admin-status-tag">
          <Clock size={12} aria-hidden="true" /> Chờ duyệt
        </Tag>
      ),
    },
    {
      title: 'Chuyên môn',
      dataIndex: 'specialization',
      key: 'specialization',
      width: 180,
      ellipsis: true,
      render: (spec: string | null) => (
        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }} title={spec || ''}>
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
        <span title={bio || ''} style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
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
          return <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Không có</span>;
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
              color: 'var(--color-primary)',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            <span>Xem chứng chỉ</span>
            <ExternalLink size={14} aria-hidden="true" />
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
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
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
                style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
              >
                Duyệt
              </Button>
            </Popconfirm>

            <Button
              danger
              size="small"
              icon={<X size={14} />}
              loading={isBusy}
              onClick={() => handleOpenRejectModal(record)}
            >
              Từ chối
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="admin-page-container">
      <AdminHeaderNav />

      {error && (
        <div className="admin-error-box" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} color="var(--color-crisis)" />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{error}</span>
          </div>
          <Button size="small" onClick={fetchPendingVolunteers} loading={loading}>
            Thử lại
          </Button>
        </div>
      )}

      <Card
        className="admin-card"
        title={
          <div className="admin-section-title" style={{ fontSize: '16px' }}>
            <UserCheck size={18} color="var(--color-primary)" aria-hidden="true" />
            <span>Hồ sơ đang chờ phê duyệt ({volunteers.length})</span>
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
          scroll={{ x: 1120 }}
          locale={{
            emptyText: 'Hiện không có hồ sơ tình nguyện viên nào đang chờ duyệt.',
          }}
          pagination={{ pageSize: 10, showTotal: (tot) => `Tổng cộng ${tot} hồ sơ` }}
        />
      </Card>

      {/* Modal từ chối hồ sơ TNV kèm nhập lý do */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-crisis)' }}>
            <X size={20} />
            <span>Từ chối hồ sơ Tình nguyện viên</span>
          </div>
        }
        open={rejectModalOpen}
        onCancel={() => {
          if (!isRejecting) {
            setRejectModalOpen(false);
            setSelectedVolunteer(null);
          }
        }}
        footer={[
          <Button key="cancel" onClick={() => setRejectModalOpen(false)} disabled={isRejecting}>
            Huỷ bỏ
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            loading={isRejecting}
            onClick={handleConfirmReject}
          >
            Xác nhận từ chối
          </Button>,
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px' }}>
          <Alert
            type="warning"
            showIcon
            message="Xác nhận từ chối hồ sơ"
            description={
              <span>
                Bạn đang từ chối hồ sơ ứng tuyển của <strong>{selectedVolunteer?.user?.fullName}</strong> ({selectedVolunteer?.user?.email}). Hồ sơ sẽ bị xoá và ứng viên sẽ nhận được thông báo kèm lý do cụ thể.
              </span>
            }
          />

          <div>
            <label
              htmlFor="reject-reason-input"
              style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: 'var(--text-primary)' }}
            >
              Lý do từ chối (Gửi tới ứng viên):
            </label>
            <Input.TextArea
              id="reject-reason-input"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối (Ví dụ: Chưa cung cấp đủ chứng chỉ sơ cứu tâm lý PFA, thông tin chuyên môn chưa rõ ràng...)"
              maxLength={500}
              showCount
              disabled={isRejecting}
            />
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Gợi ý lý do nhanh:
            </div>
            <Space wrap size={[6, 6]}>
              {[
                'Chứng chỉ sơ cứu tâm lý (PFA) chưa hợp lệ hoặc thiếu chứng thực.',
                'Thông tin chuyên môn và kinh nghiệm hỗ trợ chưa đạt yêu cầu.',
                'Ảnh chụp chứng chỉ bị mờ, không xác minh được danh tính.',
                'Chưa đáp ứng tiêu chuẩn xét duyệt tình nguyện viên đợt này.',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  className="admin-reason-chip"
                  onClick={() => setRejectReason(reason)}
                >
                  + {reason}
                </button>
              ))}
            </Space>
          </div>
        </div>
      </Modal>
    </div>
  );
};
