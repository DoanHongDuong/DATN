import React, { useEffect, useState, useCallback } from 'react';
import { Table, Button, Tag, Space, Popconfirm, Input, message, Card, Typography, Tabs } from 'antd';
import {
  Lock,
  Unlock,
  Search,
  RefreshCw,
  Users,
  User,
  UserCheck,
  Shield,
  CheckCircle2,
  Ban,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { adminApi, type AdminUser } from '../../api/admin.api';
import { useAuth } from '../../hooks/useAuth';
import { AdminHeaderNav } from './AdminHeaderNav';
import axios, { AxiosError } from 'axios';
import './admin.css';

const { Text } = Typography;

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchUsers = useCallback(async (p: number, limit: number, search?: string, role?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getUsers({
        page: p,
        limit,
        search: search || undefined,
        role: role && role !== 'ALL' ? role : undefined,
      });
      setUsers(data.items);
      setTotal(data.total);
    } catch (err: unknown) {
      console.error('Failed to fetch users:', err);
      let msg = 'Không thể tải danh sách người dùng';
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
        setLoading(true);
        setError(null);
        const data = await adminApi.getUsers({
          page,
          limit: pageSize,
          search: searchTerm || undefined,
          role: roleFilter !== 'ALL' ? roleFilter : undefined,
        });
        if (isMounted) {
          setUsers(data.items);
          setTotal(data.total);
        }
      } catch (err: unknown) {
        if (isMounted) {
          console.error('Failed to load users:', err);
          setError('Không thể tải danh sách tài khoản. Vui lòng thử lại.');
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
  }, [page, pageSize, searchTerm, roleFilter]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleToggleStatus = async (record: AdminUser) => {
    const nextStatus = record.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    setActionId(record.id);
    try {
      await adminApi.updateUserStatus(record.id, nextStatus);
      message.success(
        nextStatus === 'SUSPENDED'
          ? `Đã khoá tài khoản của ${record.fullName}`
          : `Đã mở khoá tài khoản cho ${record.fullName}`,
      );
      fetchUsers(page, pageSize, searchTerm, roleFilter);
    } catch (err: unknown) {
      let msg = 'Cập nhật trạng thái người dùng thất bại';
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
      title: 'Tên hiển thị',
      key: 'fullName',
      width: 190,
      render: (_: unknown, record: AdminUser) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {record.fullName}
            {record.id === currentUser?.id && (
              <Tag color="cyan" style={{ marginLeft: 6 }}>Tôi</Tag>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {record.phone || 'Chưa có SĐT'}
          </div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 220,
      ellipsis: true,
      render: (email: string) => (
        <Text copyable={{ text: email }} ellipsis={{ tooltip: email }}>
          {email}
        </Text>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 160,
      render: (role: string) => {
        if (role === 'ADMIN') {
          return (
            <Tag color="purple" className="admin-status-tag">
              <Shield size={12} aria-hidden="true" /> Quản trị viên
            </Tag>
          );
        }
        if (role === 'VOLUNTEER') {
          return (
            <Tag color="green" className="admin-status-tag">
              <UserCheck size={12} aria-hidden="true" /> Tình nguyện viên
            </Tag>
          );
        }
        return (
          <Tag color="blue" className="admin-status-tag">
            <User size={12} aria-hidden="true" /> Người dùng
          </Tag>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string) => {
        if (status === 'ACTIVE') {
          return (
            <Tag color="success" className="admin-status-tag">
              <CheckCircle2 size={12} aria-hidden="true" /> Hoạt động
            </Tag>
          );
        }
        if (status === 'SUSPENDED') {
          return (
            <Tag color="error" className="admin-status-tag">
              <Ban size={12} aria-hidden="true" /> Đã khoá
            </Tag>
          );
        }
        return (
          <Tag color="default" className="admin-status-tag">
            <Clock size={12} aria-hidden="true" /> Chưa kích hoạt
          </Tag>
        );
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (dateStr: string) => (
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {new Date(dateStr).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      render: (_: unknown, record: AdminUser) => {
        const isSelf = record.id === currentUser?.id;
        const isAdmin = record.role === 'ADMIN';
        const isSuspended = record.status === 'SUSPENDED';
        const isBusy = actionId === record.id;

        if (isSelf) {
          return (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Tài khoản của bạn
            </Text>
          );
        }

        if (isAdmin) {
          return (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Quản trị viên
            </Text>
          );
        }

        return (
          <Space>
            <Popconfirm
              title={isSuspended ? 'Mở khoá tài khoản?' : 'Khoá tài khoản người dùng?'}
              description={
                isSuspended
                  ? `Mở khoá tài khoản cho ${record.fullName}? Người dùng sẽ có thể đăng nhập lại.`
                  : `Bạn có chắc muốn khoá tài khoản ${record.fullName}? Phiên đăng nhập của người dùng sẽ bị chặn ngay lập tức.`
              }
              onConfirm={() => handleToggleStatus(record)}
              okText={isSuspended ? 'Mở khoá' : 'Khoá tài khoản'}
              okType={isSuspended ? 'primary' : 'danger'}
              cancelText="Huỷ"
              okButtonProps={{ loading: isBusy }}
            >
              <Button
                size="small"
                danger={!isSuspended}
                type={isSuspended ? 'primary' : 'default'}
                icon={isSuspended ? <Unlock size={14} /> : <Lock size={14} />}
                loading={isBusy}
              >
                {isSuspended ? 'Mở khoá' : 'Khoá'}
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const roleTabItems = [
    {
      key: 'ALL',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={15} /> Tất cả tài khoản
        </span>
      ),
    },
    {
      key: 'USER',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <User size={15} /> Người dùng
        </span>
      ),
    },
    {
      key: 'VOLUNTEER',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UserCheck size={15} /> Tình nguyện viên (TNV)
        </span>
      ),
    },
    {
      key: 'ADMIN',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={15} /> Quản trị viên
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
          <Button size="small" onClick={() => fetchUsers(page, pageSize, searchTerm, roleFilter)} loading={loading}>
            Thử lại
          </Button>
        </div>
      )}

      <Card
        className="admin-card"
        title={
          <div className="admin-section-title" style={{ fontSize: '16px' }}>
            <Users size={18} color="var(--color-primary)" aria-hidden="true" />
            <span>
              {roleFilter === 'USER'
                ? 'Danh sách Người dùng'
                : roleFilter === 'VOLUNTEER'
                  ? 'Danh sách Tình nguyện viên'
                  : roleFilter === 'ADMIN'
                    ? 'Danh sách Quản trị viên'
                    : 'Danh sách tất cả tài khoản'}{' '}
              ({total})
            </span>
          </div>
        }
        extra={
          <div className="admin-toolbar-group">
            <Input.Search
              className="admin-toolbar-input"
              placeholder="Tìm theo tên hoặc email..."
              allowClear
              onSearch={handleSearch}
              enterButton={<Search size={16} />}
              style={{ width: 260 }}
            />
            <Button
              icon={<RefreshCw size={14} />}
              loading={loading}
              onClick={() => fetchUsers(page, pageSize, searchTerm, roleFilter)}
            >
              Làm mới
            </Button>
          </div>
        }
      >
        <Tabs
          activeKey={roleFilter}
          onChange={(key) => {
            setRoleFilter(key);
            setPage(1);
          }}
          items={roleTabItems}
          style={{ marginBottom: '12px' }}
        />

        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 960 }}
          locale={{
            emptyText: 'Không tìm thấy tài khoản nào phù hợp.',
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (tot) => `Tổng cộng ${tot} tài khoản`,
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
