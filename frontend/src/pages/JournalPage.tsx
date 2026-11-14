import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { Modal, Button, Alert, message } from 'antd';
import { journalApi, type JournalEntry, type RelaxationResource } from '../api/journal.api';
import { chatApi } from '../api/chat.api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getEmergencyHotline } from '../utils/hotline';
import { Sparkles, Trash2, Smile, HeartHandshake, PhoneCall, PlayCircle, ExternalLink, Compass } from 'lucide-react';

const EMOJI_OPTIONS = ['😊', '😢', '😐', '😡', '😰', '🥰', '😴', '🤯'];

export const JournalPage: React.FC = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [content, setContent] = useState('');
  const [moodEmoji, setMoodEmoji] = useState('😊');
  const [resources, setResources] = useState<RelaxationResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal AI Analysis Popup state
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<{
    entry: JournalEntry;
    resources: RelaxationResource[];
  } | null>(null);

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

  const getSentimentDisplay = (label?: string | null) => {
    switch (label?.toLowerCase()) {
      case 'positive':
        return {
          title: 'Tích cực & Lạc quan',
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.3)',
          icon: '😊',
          desc: 'Tâm trạng của bạn rất tốt! Những suy nghĩ tươi sáng này sẽ là nguồn năng lượng tuyệt vời giúp bạn vượt qua mọi thử thách.',
        };
      case 'neutral':
        return {
          title: 'Bình yên & Cân bằng',
          color: '#3b82f6',
          bg: 'rgba(59, 130, 246, 0.12)',
          border: 'rgba(59, 130, 246, 0.3)',
          icon: '😌',
          desc: 'Cảm xúc của bạn đang ở trạng thái hài hòa, cân bằng. Tiếp tục duy trì nhịp sống nhẹ nhàng và lắng nghe bản thân nhé.',
        };
      case 'negative':
        return {
          title: 'Căng thẳng & Mệt mỏi',
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.3)',
          icon: '😔',
          desc: 'Hệ thống nhận thấy bạn có thể đang cảm thấy áp lực hoặc mệt mỏi. Hãy dành vài phút thả lỏng tâm trí cùng các gợi ý thư giãn bên dưới nhé.',
        };
      case 'crisis':
        return {
          title: 'Cần hỗ trợ tinh thần',
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.12)',
          border: 'rgba(239, 68, 68, 0.3)',
          icon: '🆘',
          desc: 'Bạn đang trải qua cảm xúc căng thẳng tột độ. Đừng chịu đựng một mình, chúng mình luôn ở đây sẵn sàng lắng nghe và đồng hành cùng bạn.',
        };
      default:
        return {
          title: 'Đã lưu trữ an toàn',
          color: '#8b5cf6',
          bg: 'rgba(139, 92, 246, 0.12)',
          border: 'rgba(139, 92, 246, 0.3)',
          icon: '📝',
          desc: 'Bài viết của bạn đã được mã hóa bảo mật và lưu vào nhật ký cá nhân thành công.',
        };
    }
  };

  const getCategoryDisplay = (cat?: string | null) => {
    switch (cat?.toLowerCase()) {
      case 'breathing':
        return { label: 'Bài tập Hít thở Thư giãn sâu', icon: '🌱', badge: 'Hít thở' };
      case 'music':
        return { label: 'Âm thanh & Nhạc êm dịu', icon: '🎵', badge: 'Âm nhạc' };
      case 'meditation':
        return { label: 'Bài tập Thiền định định tâm', icon: '🧘', badge: 'Thiền' };
      case 'mindfulness':
        return { label: 'Kỹ thuật Chánh niệm thực tại', icon: '✨', badge: 'Chánh niệm' };
      default:
        return { label: 'Tài nguyên thư giãn tâm lý', icon: '🌿', badge: 'Thư giãn' };
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await journalApi.create({ content, moodEmoji });
      setEntries((prev) => [created, ...prev]);
      setContent('');

      let fetchedResources: RelaxationResource[] = [];
      // Fetch suggested resources if AI provided a suggested category
      if (created.suggestedResourceCategory && created.suggestedResourceCategory !== 'none') {
        try {
          fetchedResources = await journalApi.getResources(created.suggestedResourceCategory);
          setResources(fetchedResources);
        } catch {
          // ignore resource fetch error
        }
      }

      // Lưu kết quả phân tích vừa tạo và bật Modal popup tổng quan
      setLatestAnalysis({
        entry: created,
        resources: fetchedResources,
      });
      setAnalysisModalOpen(true);

      // Nhánh crisis: nếu là crisis thì thiết lập hotline
      if (created.sentimentLabel === 'crisis') {
        setCrisisHotline(getEmergencyHotline(created.emergencyHotline));
        setNoVolunteerAvailable(false);
      }
    } catch (err: unknown) {
      let msg = 'Không thể tạo bài nhật ký';
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        msg = axiosErr.response?.data?.message || msg;
      }
      message.error(msg);
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

  const handleResourceClick = (r: RelaxationResource) => {
    // Nếu là link web bài viết bên ngoài (không phải file media r2 và không phải mã nội bộ)
    if (
      r.url.startsWith('http') &&
      !r.url.includes('.mp3') &&
      !r.url.includes('.ogg') &&
      !r.url.includes('.mp4') &&
      !r.url.includes('r2.dev')
    ) {
      window.open(r.url, '_blank', 'noreferrer');
      return;
    }
    // Điều hướng đến trang tài nguyên và tự động mở modal/trình phát tương ứng
    navigate(`/resources?open=${encodeURIComponent(r.id)}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài nhật ký này?')) return;
    try {
      await journalApi.delete(id);
      setEntries((prev) => prev.filter((item) => item.id !== id));
    } catch {
      message.error('Không thể xóa bài nhật ký');
    }
  };

  return (
    <div className="journal-layout-grid">
      {/* Left Column: Create & Entries List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Write Form */}
        <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--code-bg)' }}>
          <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-h)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-h)', fontSize: '18px' }}>Lịch sử Nhật ký</h3>
            <button
              onClick={fetchJournalEntries}
              style={{ padding: '6px 14px', fontSize: '13px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer' }}
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
                <div
                  key={r.id}
                  onClick={() => handleResourceClick(r)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'block',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-h)' }}>
                      {r.title}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: 500 }}>
                      Xem ngay →
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Danh mục: {r.category}</span>
                    {r.durationSeconds && <span>⏱ {Math.round(r.durationSeconds / 60)} phút</span>}
                  </div>
                </div>
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
                {getEmergencyHotline(crisisHotline)}
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

      {/* Modal Popup Kết quả Phân tích AI & Danh mục Gợi ý Thư giãn */}
      <Modal
        open={analysisModalOpen}
        onCancel={() => setAnalysisModalOpen(false)}
        width={560}
        style={{ maxWidth: 'calc(100vw - 24px)' }}
        centered
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px', color: 'var(--text-h)' }}>
            <Sparkles size={20} color="var(--accent)" />
            <span>Kết quả Phân tích Cảm xúc AI & Gợi ý Thư giãn</span>
          </div>
        }
        footer={[
          <Button
            key="close"
            onClick={() => setAnalysisModalOpen(false)}
            style={{ borderRadius: '8px' }}
          >
            Đóng
          </Button>,
          <Button
            key="explore"
            type="primary"
            icon={<Compass size={16} />}
            onClick={() => {
              setAnalysisModalOpen(false);
              navigate('/resources');
            }}
            style={{ borderRadius: '8px', background: 'var(--accent)', borderColor: 'var(--accent)' }}
          >
            Kho bài tập thư giãn
          </Button>,
        ]}
      >
        {latestAnalysis && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '12px 0 6px 0' }}>
            {/* Khối Đánh giá Cảm xúc */}
            {(() => {
              const sentiment = getSentimentDisplay(latestAnalysis.entry.sentimentLabel);
              return (
                <div
                  style={{
                    padding: '16px 18px',
                    borderRadius: '12px',
                    background: sentiment.bg,
                    border: `1px solid ${sentiment.border}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '28px' }}>{sentiment.icon}</span>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                          Trạng thái tâm trạng
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: sentiment.color }}>
                          {sentiment.title}
                        </div>
                      </div>
                    </div>

                    {latestAnalysis.entry.sentimentScore !== null && latestAnalysis.entry.sentimentScore !== undefined && (
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: '16px',
                          background: 'var(--bg)',
                          border: '1px solid var(--border)',
                          color: 'var(--text-h)',
                        }}
                      >
                        Chỉ số: {latestAnalysis.entry.sentimentScore > 0 ? '+' : ''}
                        {(latestAnalysis.entry.sentimentScore * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: 'var(--text-h)' }}>
                    {sentiment.desc}
                  </p>
                </div>
              );
            })()}

            {/* Khối Cảnh báo Khẩn cấp nếu phát hiện Crisis */}
            {latestAnalysis.entry.sentimentLabel === 'crisis' && (
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1px solid #fecaca',
                  background: '#fff1f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <PhoneCall size={20} color="#e11d48" />
                  <div>
                    <div style={{ fontSize: '12px', color: '#9f1239', fontWeight: 600 }}>
                      Đường dây nóng khẩn cấp:
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: '#be123c' }}>
                      {getEmergencyHotline(crisisHotline)}
                    </div>
                  </div>
                </div>
                <Button
                  danger
                  type="primary"
                  size="small"
                  icon={<HeartHandshake size={14} />}
                  loading={isConnectingVolunteer}
                  onClick={() => {
                    setAnalysisModalOpen(false);
                    handleConnectVolunteer();
                  }}
                  style={{ fontWeight: 600, borderRadius: '6px' }}
                >
                  Kết nối Tình nguyện viên
                </Button>
              </div>
            )}

            {/* Khối Danh mục & Danh sách tài nguyên gợi ý */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-h)' }}>
                  {getCategoryDisplay(latestAnalysis.entry.suggestedResourceCategory).icon}{' '}
                  Gợi ý: {getCategoryDisplay(latestAnalysis.entry.suggestedResourceCategory).label}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'var(--accent-bg)',
                    color: 'var(--accent)',
                  }}
                >
                  {getCategoryDisplay(latestAnalysis.entry.suggestedResourceCategory).badge}
                </span>
              </div>

              {latestAnalysis.resources.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {latestAnalysis.resources.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => handleResourceClick(r)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        background: 'var(--code-bg)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        <PlayCircle size={20} color="var(--accent)" style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: '13px',
                              color: 'var(--text-h)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {r.title}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text)', marginTop: '2px' }}>
                            {r.type === 'AUDIO' ? 'Âm thanh' : r.type === 'VIDEO' ? 'Video' : 'Bài viết'}
                            {r.durationSeconds && ` • ${Math.round(r.durationSeconds / 60)} phút`}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'var(--accent)',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          flexShrink: 0,
                        }}
                      >
                        Mở ngay <ExternalLink size={12} />
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px dashed var(--border)',
                    background: 'var(--code-bg)',
                    textAlign: 'center',
                    color: 'var(--text)',
                    fontSize: '13px',
                    lineHeight: 1.5,
                  }}
                >
                  🌱 Tâm trạng của bạn đang rất cân bằng và ổn định. Hãy duy trì năng lượng tích cực này hoặc ghé thăm kho tài nguyên để khám phá thêm các bài nghe thư giãn nhé!
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
