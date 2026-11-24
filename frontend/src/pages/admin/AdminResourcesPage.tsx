import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Tag,
  Space,
  Popconfirm,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  message,
  Card,
  Typography,
} from 'antd';
import {
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Search,
  Sparkles,
  Music,
  Video,
  Wind,
  FileText,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  adminApi,
  type AdminRelaxationResource,
  type CreateResourcePayload,
  type UpdateResourcePayload,
} from '../../api/admin.api';
import { AdminHeaderNav } from './AdminHeaderNav';
import axios, { AxiosError } from 'axios';
import './admin.css';

const { Text } = Typography;

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  breathing: { label: 'Bài tập thở', color: 'blue' },
  meditation: { label: 'Thiền định', color: 'purple' },
  music: { label: 'Nhạc thư giãn', color: 'green' },
  calm_audio: { label: 'Âm thanh thiên nhiên', color: 'green' },
  mindfulness: { label: 'Chánh niệm', color: 'gold' },
};

const TYPE_MAP: Record<string, { label: string; icon: React.FC<{ size?: number }> }> = {
  exercise: { label: 'Bài tập', icon: Wind },
  breathing: { label: 'Bài tập thở', icon: Wind },
  audio: { label: 'Âm thanh', icon: Music },
  video: { label: 'Video', icon: Video },
  article: { label: 'Bài viết', icon: FileText },
};

export const AdminResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<AdminRelaxationResource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<AdminRelaxationResource | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [form] = Form.useForm<CreateResourcePayload>();

  const fetchResources = useCallback(async (cat?: string) => {
    setLoading(true);
    setError(null);
    try {
      const normalizedCat = cat === 'all' ? undefined : cat;
      const data = await adminApi.getResources(normalizedCat);
      setResources(data);
    } catch (err: unknown) {
      let msg = 'Không thể tải danh sách tài nguyên thư giãn';
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
    const loadData = async () => {
      try {
        setError(null);
        const cat = selectedCategory === 'all' ? undefined : selectedCategory;
        const data = await adminApi.getResources(cat);
        if (isMounted) {
          setResources(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          let msg = 'Không thể tải danh sách tài nguyên thư giãn';
          if (axios.isAxiosError(err)) {
            const axiosErr = err as AxiosError<{ message?: string }>;
            msg = axiosErr.response?.data?.message || msg;
          }
          setError(msg);
          message.error(msg);
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
  }, [selectedCategory]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      category: 'breathing',
      type: 'exercise',
      durationSeconds: 300,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: AdminRelaxationResource) => {
    setEditingItem(item);
    form.setFieldsValue({
      title: item.title,
      type: item.type,
      url: item.url,
      durationSeconds: item.durationSeconds ?? undefined,
      category: item.category,
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (values: CreateResourcePayload) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        await adminApi.updateResource(editingItem.id, values as UpdateResourcePayload);
        message.success('Cập nhật tài nguyên thư giãn thành công!');
      } else {
        await adminApi.createResource(values);
        message.success('Thêm tài nguyên thư giãn thành công!');
      }
      setIsModalOpen(false);
      fetchResources(selectedCategory);
    } catch (err: unknown) {
      let msg = 'Thao tác thất bại';
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        msg = axiosErr.response?.data?.message || msg;
      }
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteResource(id);
      message.success('Đã xoá tài nguyên thư giãn thành công');
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      let msg = 'Không thể xoá tài nguyên thư giãn';
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        msg = axiosErr.response?.data?.message || msg;
      }
      message.error(msg);
    }
  };

  const filteredResources = resources.filter((item) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      item.url.toLowerCase().includes(searchTerm.toLowerCase().trim());
    return matchesSearch;
  });

  const columns = [
    {
      title: 'Tên tài nguyên',
      dataIndex: 'title',
      key: 'title',
      width: 300,
      render: (title: string, record: AdminRelaxationResource) => {
        const typeInfo = TYPE_MAP[record.type] || { label: record.type, icon: Sparkles };
        const Icon = typeInfo.icon;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'var(--tint-lavender)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary)',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              <Icon size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <Text strong style={{ color: 'var(--text-primary)' }}>
                {title}
              </Text>
              <div>
                <a
                  href={record.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    maxWidth: '240px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <ExternalLink size={12} aria-hidden="true" /> {record.url}
                </a>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (cat: string) => {
        const catInfo = CATEGORY_MAP[cat] || { label: cat, color: 'default' };
        return <Tag color={catInfo.color} className="admin-status-tag">{catInfo.label}</Tag>;
      },
    },
    {
      title: 'Định dạng',
      dataIndex: 'type',
      key: 'type',
      width: 130,
      render: (type: string) => {
        const normalized = (type || '').toLowerCase();
        const typeInfo = TYPE_MAP[normalized] || { label: type, icon: Sparkles };
        const Icon = typeInfo.icon;
        return (
          <Tag className="admin-status-tag">
            <Icon size={12} /> {typeInfo.label}
          </Tag>
        );
      },
    },
    {
      title: 'Thời lượng',
      dataIndex: 'durationSeconds',
      key: 'durationSeconds',
      width: 130,
      render: (sec: number | null) => {
        if (!sec) return <Text type="secondary">Không giới hạn</Text>;
        const minutes = Math.floor(sec / 60);
        const remainingSec = sec % 60;
        return (
          <Text style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {minutes > 0 ? `${minutes} phút ` : ''}
            {remainingSec > 0 ? `${remainingSec}s` : ''}
          </Text>
        );
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => (
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {new Date(date).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: unknown, record: AdminRelaxationResource) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<Edit2 size={15} />}
            onClick={() => handleOpenEditModal(record)}
            style={{ color: 'var(--color-primary)' }}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xoá tài nguyên"
            description={`Bạn có chắc chắn muốn xoá "${record.title}"?`}
            onConfirm={() => handleDelete(record.id)}
            okText="Xoá"
            cancelText="Huỷ"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" danger icon={<Trash2 size={15} />}>
              Xoá
            </Button>
          </Popconfirm>
        </Space>
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
          <Button size="small" onClick={() => fetchResources(selectedCategory)} loading={loading}>
            Thử lại
          </Button>
        </div>
      )}

      <Card
        className="admin-card"
        title={
          <div className="admin-section-title" style={{ fontSize: '16px' }}>
            <Sparkles size={18} color="var(--color-primary)" aria-hidden="true" />
            <span>Quản lý Tài nguyên Thư giãn ({filteredResources.length})</span>
          </div>
        }
        extra={
          <Button type="primary" icon={<Plus size={16} />} onClick={handleOpenAddModal}>
            Thêm tài nguyên mới
          </Button>
        }
      >
        {/* Controls: Search & Filter */}
        <div className="admin-toolbar">
          <div className="admin-toolbar-group" style={{ flex: 1 }}>
            <Input
              className="admin-toolbar-input"
              prefix={<Search size={16} style={{ color: 'var(--text-secondary)' }} />}
              placeholder="Tìm theo tên hoặc URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 260 }}
              allowClear
            />
            <Select
              className="admin-toolbar-select"
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val)}
              style={{ width: 190 }}
              options={[
                { label: 'Tất cả danh mục', value: 'all' },
                { label: 'Bài tập thở', value: 'breathing' },
                { label: 'Thiền định', value: 'meditation' },
                { label: 'Nhạc thư giãn', value: 'music' },
                { label: 'Chánh niệm', value: 'mindfulness' },
              ]}
            />
            <Button icon={<RefreshCw size={14} />} loading={loading} onClick={() => fetchResources(selectedCategory)}>
              Làm mới
            </Button>
          </div>
        </div>

        {/* Resources Table */}
        <Table
          dataSource={filteredResources}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 880 }}
          locale={{ emptyText: 'Chưa có tài nguyên thư giãn nào phù hợp.' }}
          pagination={{ pageSize: 8, showTotal: (tot) => `Tổng cộng ${tot} tài nguyên` }}
        />
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        title={editingItem ? 'Chỉnh sửa tài nguyên thư giãn' : 'Thêm tài nguyên thư giãn mới'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText={editingItem ? 'Lưu thay đổi' : 'Tạo mới'}
        cancelText="Huỷ"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleModalSubmit} style={{ marginTop: '16px' }}>
          <Form.Item
            label="Tên bài tập / tài nguyên"
            name="title"
            rules={[{ required: true, message: 'Vui lòng nhập tên tài nguyên' }]}
          >
            <Input placeholder="Ví dụ: Kỹ thuật thở 4-7-8 giảm lo âu" />
          </Form.Item>

          <div className="admin-modal-grid">
            <Form.Item
              label="Danh mục"
              name="category"
              rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
            >
              <Select
                options={[
                  { label: 'Bài tập thở', value: 'breathing' },
                  { label: 'Thiền định', value: 'meditation' },
                  { label: 'Nhạc thư giãn', value: 'music' },
                  { label: 'Chánh niệm', value: 'mindfulness' },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Định dạng"
              name="type"
              rules={[{ required: true, message: 'Vui lòng chọn định dạng' }]}
            >
              <Select
                options={[
                  { label: 'Bài tập tương tác (Exercise)', value: 'exercise' },
                  { label: 'Âm thanh (Audio)', value: 'audio' },
                  { label: 'Video hướng dẫn', value: 'video' },
                  { label: 'Bài viết hướng dẫn (Article)', value: 'article' },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item
            label="Đường dẫn liên kết / URL"
            name="url"
            rules={[{ required: true, message: 'Vui lòng nhập đường dẫn URL' }]}
            extra="Nhập link Youtube, file âm thanh mp3 hoặc đường dẫn tài nguyên nội bộ"
          >
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item
            label="Thời lượng (tính bằng giây)"
            name="durationSeconds"
            extra="Ví dụ: 300 giây = 5 phút; để trống nếu là bài đọc không giới hạn thời gian"
          >
            <InputNumber min={0} step={30} style={{ width: '100%' }} placeholder="300" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
