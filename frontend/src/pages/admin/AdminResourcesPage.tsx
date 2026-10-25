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
} from 'lucide-react';
import {
  adminApi,
  type AdminRelaxationResource,
  type CreateResourcePayload,
  type UpdateResourcePayload,
} from '../../api/admin.api';
import { AdminHeaderNav } from './AdminHeaderNav';
import axios, { AxiosError } from 'axios';

const { Text } = Typography;

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  breathing: { label: 'Bài tập thở', color: 'blue' },
  meditation: { label: 'Thiền định', color: 'purple' },
  music: { label: 'Nhạc thư giãn', color: 'green' },
  mindfulness: { label: 'Chánh niệm', color: 'gold' },
};

const TYPE_MAP: Record<string, { label: string; icon: React.FC<{ size?: number }> }> = {
  exercise: { label: 'Bài tập', icon: Wind },
  audio: { label: 'Âm thanh', icon: Music },
  video: { label: 'Video', icon: Video },
  article: { label: 'Bài viết', icon: FileText },
};

export const AdminResourcesPage: React.FC = () => {
  const [resources, setResources] = useState<AdminRelaxationResource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<AdminRelaxationResource | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [form] = Form.useForm<CreateResourcePayload>();

  const fetchResources = useCallback(async (cat?: string) => {
    setLoading(true);
    try {
      const data = await adminApi.getResources(cat);
      setResources(data);
    } catch (err: unknown) {
      let msg = 'Không thể tải danh sách tài nguyên thư giãn';
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
    const loadData = async () => {
      try {
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
      render: (title: string, record: AdminRelaxationResource) => {
        const typeInfo = TYPE_MAP[record.type] || { label: record.type, icon: Sparkles };
        const Icon = typeInfo.icon;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--code-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              <Icon size={16} />
            </div>
            <div>
              <Text strong style={{ color: 'var(--text-h)' }}>
                {title}
              </Text>
              <div>
                <a
                  href={record.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '12px',
                    color: 'var(--text)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    maxWidth: '300px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <ExternalLink size={12} /> {record.url}
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
      render: (cat: string) => {
        const catInfo = CATEGORY_MAP[cat] || { label: cat, color: 'default' };
        return <Tag color={catInfo.color}>{catInfo.label}</Tag>;
      },
    },
    {
      title: 'Định dạng',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeInfo = TYPE_MAP[type] || { label: type };
        return <Tag>{typeInfo.label}</Tag>;
      },
    },
    {
      title: 'Thời lượng',
      dataIndex: 'durationSeconds',
      key: 'durationSeconds',
      render: (sec: number | null) => {
        if (!sec) return <Text type="secondary">Không xác định</Text>;
        const minutes = Math.floor(sec / 60);
        const remainingSec = sec % 60;
        return (
          <Text style={{ fontSize: '13px' }}>
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
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: unknown, record: AdminRelaxationResource) => (
        <Space>
          <Button
            type="text"
            icon={<Edit2 size={15} />}
            onClick={() => handleOpenEditModal(record)}
            style={{ color: 'var(--accent)' }}
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
            <Button type="text" danger icon={<Trash2 size={15} />}>
              Xoá
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <AdminHeaderNav />

      <Card style={{ borderRadius: '12px', border: '1px solid var(--border)' }}>
        {/* Controls: Search, Filter, Add */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Input
              prefix={<Search size={16} style={{ color: 'var(--text)' }} />}
              placeholder="Tìm theo tên hoặc URL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '260px' }}
              allowClear
            />
            <Select
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val)}
              style={{ width: '180px' }}
              options={[
                { label: 'Tất cả danh mục', value: 'all' },
                { label: 'Bài tập thở', value: 'breathing' },
                { label: 'Thiền định', value: 'meditation' },
                { label: 'Nhạc thư giãn', value: 'music' },
                { label: 'Chánh niệm', value: 'mindfulness' },
              ]}
            />
            <Button icon={<RefreshCw size={14} />} onClick={() => fetchResources(selectedCategory)}>
              Làm mới
            </Button>
          </div>

          <Button type="primary" icon={<Plus size={16} />} onClick={handleOpenAddModal}>
            Thêm tài nguyên mới
          </Button>
        </div>

        {/* Resources Table */}
        <Table
          dataSource={filteredResources}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8, showTotal: (total) => `Tổng cộng ${total} tài nguyên` }}
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
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleModalSubmit} style={{ marginTop: '16px' }}>
          <Form.Item
            label="Tên bài tập / tài nguyên"
            name="title"
            rules={[{ required: true, message: 'Vui lòng nhập tên tài nguyên' }]}
          >
            <Input placeholder="Ví dụ: Kỹ thuật thở 4-7-8 giảm lo âu" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
