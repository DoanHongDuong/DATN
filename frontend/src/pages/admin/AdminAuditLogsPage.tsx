import React, { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Card, Select, DatePicker, Button, Space, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ClipboardList, RefreshCw, Filter, Calendar } from 'lucide-react';
import type { Dayjs } from 'dayjs';
import axios, { AxiosError } from 'axios';
import { AdminHeaderNav } from './AdminHeaderNav';
import { adminApi, type AuditLog } from '../../api/admin.api';

const { Text } = Typography;
const { RangePicker } = DatePicker;

// Map action sang màu tag phù hợp
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
  { value: 'LOCK_USER', label: 'LOCK_USER (Khóa người dùng)' },
  { value: 'UNLOCK_USER', label: 'UNLOCK_USER (Mở khóa người dùng)' },
  { value: 'CREATE_RESOURCE', label: 'CREATE_RESOURCE (Tạo tài nguyên)' },
  { value: 'UPDATE_RESOURCE', label: 'UPDATE_RESOURCE (Cập nhật tài nguyên)' },
  { value: 'DELETE_RESOURCE', label: 'DELETE_RESOURCE (Xóa tài nguyên)' },
];

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const fetchLogs = useCallback(
    async (p: number, limit: number, action?: string, range?: [Dayjs | null, Dayjs | null] | null) => {
      setLoading(true);
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
        <span style={{ fontSize: '13px', color: 'var(--text-h)', fontWeight: 500 }}>
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
          <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>{actor?.fullName || 'Hệ thống'}</span>
          <span style={{ fontSize: '12px', color: 'var(--text)' }}>{actor?.email || ''}</span>
        </div>
      ),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      width: 180,
      render: (action: string) => {
        const color = ACTION_COLOR_MAP[action] || 'default';
        return (
          <Tag color={color} style={{ fontWeight: 600, padding: '2px 8px', borderRadius: '4px' }}>
            {action}
          </Tag>
        );
      },
    },
    {
      title: 'Đối tượng',
      dataIndex: 'targetId',
      key: 'targetId',
      width: 240,
      render: (targetId: string | null) =>
        targetId ? (
          <code
            style={{
              fontSize: '12px',
              background: 'var(--code-bg)',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              color: 'var(--text-h)',
            }}
          >
            {targetId}
          </code>
        ) : (
          <span style={{ color: 'var(--text)' }}>—</span>
        ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string | null) => (
        <span style={{ color: 'var(--text-h)', fontSize: '13px', lineHeight: 1.5 }}>
          {desc || '—'}
        </span>
      ),
    },
  ];

  return (
    <div>
      <AdminHeaderNav />

      <Card
        style={{
          borderRadius: '16px',
          border: '1px solid var(--border)',
          background: 'var(--bg)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '18px',
                color: 'var(--text-h)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ClipboardList size={20} color="var(--accent)" /> Nhật ký kiểm toán (Audit Logs)
            </h3>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              Theo dõi toàn bộ các hoạt động quản trị hệ thống (ghi nhận bất biến, chỉ đọc)
            </Text>
          </div>

          <Space wrap size="middle">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={15} color="var(--text)" />
              <Select
                value={selectedAction}
                onChange={(val) => {
                  setSelectedAction(val);
                  setPage(1);
                }}
                style={{ width: 220 }}
                options={ACTION_OPTIONS}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={15} color="var(--text)" />
              <RangePicker
                value={dateRange}
                onChange={(dates) => {
                  setDateRange(dates as [Dayjs | null, Dayjs | null] | null);
                  setPage(1);
                }}
                format="DD/MM/YYYY"
                placeholder={['Từ ngày', 'Đến ngày']}
                style={{ width: 260 }}
              />
            </div>

            {(selectedAction || dateRange) && (
              <Button onClick={handleResetFilters} style={{ borderRadius: '8px' }}>
                Đặt lại
              </Button>
            )}

            <Button
              icon={<RefreshCw size={15} />}
              onClick={() => fetchLogs(page, pageSize, selectedAction, dateRange)}
              loading={loading}
              style={{ borderRadius: '8px' }}
            >
              Làm mới
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          scroll={{ x: 750 }}
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
          style={{ overflowX: 'auto' }}
        />
      </Card>
    </div>
  );
};
