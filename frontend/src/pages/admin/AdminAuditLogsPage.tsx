import React, { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Card, Select, DatePicker, Button, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ClipboardList, RefreshCw, Filter, Calendar, AlertCircle } from 'lucide-react';
import type { Dayjs } from 'dayjs';
import axios, { AxiosError } from 'axios';
import { AdminHeaderNav } from './AdminHeaderNav';
import { adminApi, type AuditLog } from '../../api/admin.api';
import './admin.css';

const { RangePicker } = DatePicker;

const ACTION_COLOR_MAP: Record<string, string> = {
  APPROVE_VOLUNTEER: 'success',
  REJECT_VOLUNTEER: 'error',
  LOCK_USER: 'volcano',
  UNLOCK_USER: 'blue',
  CREATE_RESOURCE: 'purple',
  UPDATE_RESOURCE: 'orange',
  DELETE_RESOURCE: 'magenta',
};

const ACTION_OPTIONS = [
  { value: '', label: 'Tất cả hành động' },
  { value: 'APPROVE_VOLUNTEER', label: 'APPROVE_VOLUNTEER (Duyệt TNV)' },
  { value: 'REJECT_VOLUNTEER', label: 'REJECT_VOLUNTEER (Từ chối TNV)' },
  { value: 'LOCK_USER', label: 'LOCK_USER (Khóa tài khoản)' },
  { value: 'UNLOCK_USER', label: 'UNLOCK_USER (Mở khóa tài khoản)' },
  { value: 'CREATE_RESOURCE', label: 'CREATE_RESOURCE (Tạo tài nguyên)' },
  { value: 'UPDATE_RESOURCE', label: 'UPDATE_RESOURCE (Cập nhật tài nguyên)' },
  { value: 'DELETE_RESOURCE', label: 'DELETE_RESOURCE (Xóa tài nguyên)' },
];

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const fetchLogs = useCallback(
    async (p: number, limit: number, action?: string, range?: [Dayjs | null, Dayjs | null] | null) => {
      setLoading(true);
      setError(null);
      try {
        const from = range && range[0] ? range[0].startOf('day').toISOString() : undefined;
        const to = range && range[1] ? range[1].endOf('day').toISOString() : undefined;

        const res = await adminApi.getAuditLogs({
          page: p,
          limit,
          action: action && action !== '' ? action : undefined,
          from,
          to,
        });

        setLogs(res.data);
        setTotal(res.meta.total);
      } catch (err: unknown) {
        console.error('Failed to fetch audit logs:', err);
        let msg = 'Không thể tải nhật ký kiểm toán';
        if (axios.isAxiosError(err)) {
          const axiosErr = err as AxiosError<{ message?: string }>;
          msg = axiosErr.response?.data?.message || msg;
        }
        setError(msg);
        message.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setError(null);
        const from = dateRange && dateRange[0] ? dateRange[0].startOf('day').toISOString() : undefined;
        const to = dateRange && dateRange[1] ? dateRange[1].endOf('day').toISOString() : undefined;

        const res = await adminApi.getAuditLogs({
          page,
          limit: pageSize,
          action: selectedAction && selectedAction !== '' ? selectedAction : undefined,
          from,
          to,
        });

        if (isMounted) {
          setLogs(res.data);
          setTotal(res.meta.total);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Failed to load audit logs:', err);
          setError('Không thể tải nhật ký kiểm toán. Vui lòng thử lại.');
        }
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
  }, [page, pageSize, selectedAction, dateRange]);

  const handleResetFilters = () => {
    setSelectedAction('');
    setDateRange(null);
    setPage(1);
  };

  const columns: ColumnsType<AuditLog> = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (val: string) => (
        <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
          {new Date(val).toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'actor',
      key: 'actor',
      width: 220,
      render: (actor: { fullName: string; email: string }) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{actor?.fullName || 'Hệ thống'}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{actor?.email || ''}</span>
        </div>
      ),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      width: 185,
      render: (action: string) => {
        const color = ACTION_COLOR_MAP[action] || 'default';
        return (
          <Tag color={color} className="admin-status-tag">
            {action}
          </Tag>
        );
      },
    },
    {
      title: 'Đối tượng',
      dataIndex: 'targetId',
      key: 'targetId',
      width: 220,
      render: (targetId: string | null) =>
        targetId ? (
          <code className="admin-code-pill">{targetId}</code>
        ) : (
          <span style={{ color: 'var(--text-secondary)' }}>—</span>
        ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string | null) => (
        <span style={{ color: 'var(--text-primary)', fontSize: '13px', lineHeight: 1.5 }}>
          {desc || '—'}
        </span>
      ),
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
          <Button
            size="small"
            onClick={() => fetchLogs(page, pageSize, selectedAction, dateRange)}
            loading={loading}
          >
            Thử lại
          </Button>
        </div>
      )}

      <Card
        className="admin-card"
        title={
          <div>
            <div className="admin-section-title" style={{ fontSize: '16px' }}>
              <ClipboardList size={18} color="var(--color-primary)" aria-hidden="true" />
              <span>Nhật ký kiểm toán (Audit Logs)</span>
            </div>
            <p className="admin-section-subtitle">
              Theo dõi toàn bộ hoạt động quản trị hệ thống (bất biến, chỉ đọc)
            </p>
          </div>
        }
        extra={
          <Button
            icon={<RefreshCw size={14} />}
            onClick={() => fetchLogs(page, pageSize, selectedAction, dateRange)}
            loading={loading}
          >
            Làm mới
          </Button>
        }
      >
        <div className="admin-toolbar">
          <div className="admin-toolbar-group" style={{ flex: 1 }}>
            <div className="admin-toolbar-select" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={15} color="var(--text-secondary)" aria-hidden="true" />
              <Select
                className="admin-toolbar-select"
                value={selectedAction}
                onChange={(val) => {
                  setSelectedAction(val);
                  setPage(1);
                }}
                style={{ width: 240 }}
                options={ACTION_OPTIONS}
                aria-label="Lọc theo hành động"
              />
            </div>

            <div className="admin-toolbar-picker" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={15} color="var(--text-secondary)" aria-hidden="true" />
              <RangePicker
                className="admin-toolbar-picker"
                value={dateRange}
                onChange={(dates) => {
                  setDateRange(dates as [Dayjs | null, Dayjs | null] | null);
                  setPage(1);
                }}
                format="DD/MM/YYYY"
                placeholder={['Từ ngày', 'Đến ngày']}
                style={{ width: 250 }}
              />
            </div>

            {(selectedAction || dateRange) && (
              <Button onClick={handleResetFilters}>Đặt lại bộ lọc</Button>
            )}
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          scroll={{ x: 820 }}
          locale={{ emptyText: 'Không tìm thấy bản ghi kiểm toán nào.' }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (tot) => `Tổng số ${tot} bản ghi kiểm toán`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>
    </div>
  );
};
