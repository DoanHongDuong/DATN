import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Popconfirm, message, Card, Typography, Modal, Input, Alert, Tag, Descriptions } from 'antd';
import { ExternalLink, Check, X, RefreshCw, UserCheck, Clock, AlertCircle, Eye, Mail, Calendar, Award, FileText } from 'lucide-react';
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

  // State cho Modal xem chi tiết hồ sơ
  const [detailVolunteer, setDetailVolunteer] = useState<PendingVolunteer | null>(null);

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
      setDetailVolunteer((prev) => (prev?.id === profileId ? null : prev));
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
      width: 200,
      render: (_: unknown, record: PendingVolunteer) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <button
            type="button"
            onClick={() => setDetailVolunteer(record)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              textAlign: 'left',
              fontWeight: 600,
              color: 'var(--color-primary)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {record.user?.fullName}
          </button>
          <Text
            copyable={{ text: record.user?.email }}
            ellipsis={{ tooltip: record.user?.email }}
            style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: 175 }}
          >
            {record.user?.email}
          </Text>
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', opacity: 0.8 }}>
            Nộp: {new Date(record.createdAt).toLocaleDateString('vi-VN')}
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 110,
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
      width: 155,
      render: (spec: string | null) => (
        <div
          style={{
            fontWeight: 500,
            color: 'var(--text-primary)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.45,
          }}
          title={spec || ''}
        >
          {spec || 'Chưa cập nhật'}
        </div>
      ),
    },
    {
      title: 'Giới thiệu / Kinh nghiệm',
      dataIndex: 'bio',
      key: 'bio',
      width: 195,
      render: (bio: string | null) => (
        <div
          title={bio || ''}
          style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.45,
          }}
        >
          {bio || 'Không có mô tả'}
        </div>
      ),
    },
    {
      title: 'Chứng chỉ',
      dataIndex: 'certificateUrl',
      key: 'certificateUrl',
      width: 100,
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
            <span>Mở link</span>
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 290,
      render: (_: unknown, record: PendingVolunteer) => {
        const isBusy = actionId === record.id;
        return (
          <Space size={6}>
            <Button
              size="small"
              icon={<Eye size={14} />}
              onClick={() => setDetailVolunteer(record)}
            >
              Chi tiết
            </Button>

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
          scroll={{ x: 1050 }}
          locale={{
            emptyText: 'Hiện không có hồ sơ tình nguyện viên nào đang chờ duyệt.',
          }}
          pagination={{ pageSize: 10, showTotal: (tot) => `Tổng cộng ${tot} hồ sơ` }}
        />
      </Card>

      {/* Modal xem chi tiết hồ sơ ứng viên TNV */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <UserCheck size={20} color="var(--color-primary)" />
            <span>Chi tiết hồ sơ Tình nguyện viên</span>
            <Tag color="warning" className="admin-status-tag" style={{ marginLeft: 4 }}>
              <Clock size={12} aria-hidden="true" /> Chờ duyệt
            </Tag>
          </div>
        }
        open={Boolean(detailVolunteer)}
        onCancel={() => setDetailVolunteer(null)}
        width={680}
        footer={
          detailVolunteer
            ? [
                <Button key="close" onClick={() => setDetailVolunteer(null)}>
                  Đóng
                </Button>,
                <Button
                  key="reject"
                  danger
                  icon={<X size={14} />}
                  disabled={actionId === detailVolunteer.id}
                  onClick={() => {
                    const target = detailVolunteer;
                    setDetailVolunteer(null);
                    handleOpenRejectModal(target);
                  }}
                >
                  Từ chối hồ sơ
                </Button>,
                <Popconfirm
                  key="approve"
                  title="Phê duyệt tình nguyện viên?"
                  description={`Xác nhận phê duyệt cho ${detailVolunteer.user?.fullName} làm Tình nguyện viên?`}
                  onConfirm={() => handleApprove(detailVolunteer.id)}
                  okText="Đồng ý duyệt"
                  cancelText="Huỷ"
                  okButtonProps={{ loading: actionId === detailVolunteer.id }}
                >
                  <Button
                    type="primary"
                    icon={<Check size={14} />}
                    loading={actionId === detailVolunteer.id}
                    style={{ background: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                  >
                    Phê duyệt hồ sơ
                  </Button>
                </Popconfirm>,
              ]
            : null
        }
      >
        {detailVolunteer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
            <Descriptions
              bordered
              column={{ xs: 1, sm: 2 }}
              size="small"
            >
              <Descriptions.Item label="Họ và tên">
                <strong style={{ color: 'var(--text-primary)' }}>
                  {detailVolunteer.user?.fullName || 'Chưa cập nhật'}
                </strong>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Mail size={13} /> Email
                  </span>
                }
              >
                <Text copyable={{ text: detailVolunteer.user?.email }}>
                  {detailVolunteer.user?.email || 'Không có'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Mã hồ sơ">
                <Text copyable={{ text: detailVolunteer.id }} style={{ fontFamily: 'var(--mono)', fontSize: '12.5px' }}>
                  {detailVolunteer.id}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={13} /> Ngày nộp
                  </span>
                }
              >
                {new Date(detailVolunteer.createdAt).toLocaleString('vi-VN')}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                <Award size={15} color="var(--color-primary)" />
                <span>Chuyên môn / Bằng cấp</span>
              </div>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {detailVolunteer.specialization || 'Chưa cập nhật'}
              </div>
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                <FileText size={15} color="var(--color-primary)" />
                <span>Giới thiệu & Kinh nghiệm hỗ trợ</span>
              </div>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                  maxHeight: '240px',
                  overflowY: 'auto',
                }}
              >
                {detailVolunteer.bio || 'Không có mô tả'}
              </div>
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                }}
              >
                <ExternalLink size={15} color="var(--color-primary)" />
                <span>Chứng chỉ / Tài liệu đính kèm</span>
              </div>
              {detailVolunteer.certificateUrl ? (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <Text
                    copyable={{ text: detailVolunteer.certificateUrl }}
                    ellipsis={{ tooltip: detailVolunteer.certificateUrl }}
                    style={{ maxWidth: '460px', fontSize: '13px', color: 'var(--text-secondary)' }}
                  >
                    {detailVolunteer.certificateUrl}
                  </Text>
                  <a
                    href={detailVolunteer.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      color: 'var(--color-primary)',
                      fontWeight: 600,
                      fontSize: '13.5px',
                      flexShrink: 0,
                    }}
                  >
                    <span>Mở tài liệu</span>
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Ứng viên không đính kèm liên kết chứng chỉ.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

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
