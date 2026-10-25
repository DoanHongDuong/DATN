import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { Modal, Button, Alert, message } from 'antd';
import { journalApi, type JournalEntry, type RelaxationResource } from '../api/journal.api';
import { chatApi } from '../api/chat.api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Sparkles, Trash2, Smile, HeartHandshake, PhoneCall } from 'lucide-react';

const EMOJI_OPTIONS = ['😊', '😢', '😐', '😡', '😰', '🥰', '😴', '🤯'];

export const JournalPage: React.FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [content, setContent] = useState('');
  const [moodEmoji, setMoodEmoji] = useState('😊');
  const [resources, setResources] = useState<RelaxationResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal crisis state
  const [crisisModalOpen, setCrisisModalOpen] = useState(false);
  const [crisisHotline, setCrisisHotline] = useState<string>('');
  const [noVolunteerAvailable, setNoVolunteerAvailable] = useState(false);
  const [isConnectingVolunteer, setIsConnectingVolunteer] = useState(false);

  const fetchJournalEntries = useCallback(async () => {
    try {
      const data = await journalApi.findAll();
      setEntries(data.data || []);
    } catch (err) {
      console.error('Failed to fetch journal entries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const data = await journalApi.findAll();
        if (isMounted) {
          setEntries(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch journal entries:', err);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await journalApi.create({ content, moodEmoji });
      setEntries((prev) => [created, ...prev]);
      setContent('');

      // Fetch suggested resources if AI provided a suggested category
      if (created.suggestedResourceCategory) {
        const res = await journalApi.getResources(created.suggestedResourceCategory);
        setResources(res);
      }

      // Nhánh crisis: chỉ hiển thị Modal cho bản ghi VỪA TẠO
      if (created.sentimentLabel === 'crisis') {
        setCrisisHotline(created.emergencyHotline || '1900xxxx - Đường dây nóng Tâm lý học đường');
        setNoVolunteerAvailable(false);
        setCrisisModalOpen(true);
      }
    } catch (err: unknown) {
      let msg = 'Không thể tạo bài nhật ký';
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        msg = axiosErr.response?.data?.message || msg;
      }
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConnectVolunteer = async () => {
    setIsConnectingVolunteer(true);
    try {
      const response = await chatApi.requestSupport();

      if (response.noVolunteerAvailable) {
        setNoVolunteerAvailable(true);
        if (response.hotline) {
          setCrisisHotline(response.hotline);
        }
        return;
      }

      setCrisisModalOpen(false);
      navigate('/chat');
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        // Nếu user đã có phiên WAITING/ACTIVE thì điều hướng sang /chat
        setCrisisModalOpen(false);
        navigate('/chat');
        return;
      }

      try {
        const activeSession = await chatApi.getMyActiveSession();
        if (activeSession && (activeSession.status === 'WAITING' || activeSession.status === 'ACTIVE')) {
          setCrisisModalOpen(false);
          navigate('/chat');
          return;
        }
      } catch {
        // bỏ qua fallback error
      }

      let errorMsg = 'Không thể gửi yêu cầu kết nối với tình nguyện viên. Vui lòng thử lại sau.';
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        if (axiosErr.response?.data?.message) {
          errorMsg = axiosErr.response.data.message;
        }
      }
      message.error(errorMsg);
    } finally {
      setIsConnectingVolunteer(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài nhật ký này?')) return;
    try {
      await journalApi.delete(id);
      setEntries((prev) => prev.filter((item) => item.id !== id));
    } catch {
      alert('Không thể xóa bài nhật ký');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px' }}>
      {/* Left Column: Create & Entries List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Write Form */}
        <div style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)' }}>
          <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smile size={20} color="var(--accent)" /> Viết Nhật ký Cá nhân
          </h3>

          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text)' }}>
                Tâm trạng hiện tại của bạn:
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setMoodEmoji(e)}
                    style={{
                      fontSize: '20px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: moodEmoji === e ? '2px solid var(--accent)' : '1px solid var(--border)',
                      background: moodEmoji === e ? 'var(--accent-bg)' : 'var(--bg)',
                      cursor: 'pointer'
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <textarea
                required
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Chia sẻ những suy nghĩ, cảm xúc hay câu chuyện hôm nay của bạn... (Nội dung được mã hóa bảo mật)"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text-h)',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              <Sparkles size={18} />
              {isSubmitting ? 'Đang mã hóa & Phân tích AI...' : 'Lưu nhật ký'}
            </button>
          </form>
        </div>

        {/* Entries List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-h)' }}>Lịch sử Nhật ký</h3>
            <button
              onClick={fetchJournalEntries}
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer' }}
            >
              Làm mới
            </button>
          </div>

          {loading ? (
            <LoadingSpinner message="Đang tải nhật ký..." />
          ) : entries.length === 0 ? (
            <p style={{ color: 'var(--text)', fontSize: '14px' }}>Chưa có bài viết nhật ký nào.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {entries.map((item) => (
                <div key={item.id} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{item.moodEmoji || '📝'}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text)' }}>
                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <p style={{ margin: '0 0 10px 0', color: 'var(--text-h)', fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {item.content}
                  </p>

                  {item.sentimentLabel && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: item.sentimentLabel === 'crisis' ? '#fee2e2' : 'var(--code-bg)',
                        fontSize: '12px',
                        color: item.sentimentLabel === 'crisis' ? '#dc2626' : 'var(--accent)',
                        fontWeight: 600,
                      }}
                    >
                      <Sparkles size={14} /> AI Sentiment: {item.sentimentLabel} ({item.sentimentScore})
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Suggested Relaxation Resources */}
      <div>
        <div style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)', position: 'sticky', top: '80px' }}>
          <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-h)' }}>🌱 Gợi ý Thư giãn từ AI</h3>
          <p style={{ color: 'var(--text)', fontSize: '13px', marginBottom: '16px' }}>
            Dựa trên phân tích cảm xúc bài viết mới nhất, AI gợi ý các tài nguyên giúp bạn cân bằng cảm xúc:
          </p>

          {resources.length === 0 ? (
            <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--bg)', color: 'var(--text)', fontSize: '13px', textAlign: 'center' }}>
              Hãy viết một nhật ký mới để nhận gợi ý thư giãn cá nhân hóa!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {resources.map((r) => (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    textDecoration: 'none',
                    display: 'block'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-h)', marginBottom: '4px' }}>
                    {r.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Danh mục: {r.category}</span>
                    {r.durationSeconds && <span>⏱ {Math.round(r.durationSeconds / 60)} phút</span>}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Hỗ trợ khẩn cấp khi nhận diện tâm trạng crisis */}
      <Modal
        open={crisisModalOpen}
        onCancel={() => setCrisisModalOpen(false)}
        closable={true}
        maskClosable={false}
        footer={[
          <Button
            key="close"
            onClick={() => setCrisisModalOpen(false)}
            style={{ borderRadius: '8px' }}
          >
            Tôi ổn, đóng lại
          </Button>,
          <Button
            key="connect"
            type="primary"
            danger
            loading={isConnectingVolunteer}
            onClick={handleConnectVolunteer}
            style={{ borderRadius: '8px', fontWeight: 600 }}
          >
            Kết nối với tình nguyện viên ngay
          </Button>,
        ]}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontSize: '18px' }}>
            <HeartHandshake size={24} />
            <span>Hỗ trợ tinh thần</span>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px 0 8px 0' }}>
          <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.6, color: 'var(--text-h)' }}>
            Mình rất tiếc khi bạn đang cảm thấy như vậy. Bạn không phải một mình, và có người sẵn sàng lắng nghe bạn.
          </p>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              border: '1px solid #fecaca',
              background: '#fff1f2',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <PhoneCall size={20} color="#e11d48" />
            <div>
              <div style={{ fontSize: '12px', color: '#9f1239', fontWeight: 500 }}>
                Đường dây nóng hỗ trợ khẩn cấp:
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#be123c', marginTop: '2px' }}>
                {crisisHotline || '1900xxxx - Đường dây nóng Tâm lý học đường'}
              </div>
            </div>
          </div>

          {noVolunteerAvailable && (
            <Alert
              type="warning"
              showIcon
              message="Hiện không có tình nguyện viên nào đang trực tuyến"
              description={
                <span>
                  Bạn vui lòng liên hệ trực tiếp đường dây nóng khẩn cấp:{' '}
                  <strong style={{ color: '#be123c' }}>{crisisHotline}</strong> để được hỗ trợ kịp thời.
                </span>
              }
            />
          )}
        </div>
      </Modal>
    </div>
  );
};
