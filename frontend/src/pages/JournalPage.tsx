import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import { Modal, Button, Alert, message, Input } from 'antd';
import { journalApi, type JournalEntry, type RelaxationResource } from '../api/journal.api';
import { chatApi } from '../api/chat.api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getEmergencyHotline } from '../utils/hotline';
import {
  Sparkles,
  Trash2,
  HeartHandshake,
  PhoneCall,
  PlayCircle,
  ExternalLink,
  Compass,
  RefreshCw,
  BookOpen,
  ShieldCheck,
  Lock,
  ArrowRight,
} from 'lucide-react';
import './journal.css';

const EMOJI_OPTIONS = [
  { emoji: '😊', label: 'Vui vẻ' },
  { emoji: '🥰', label: 'Biết ơn' },
  { emoji: '😌', label: 'Bình yên' },
  { emoji: '😐', label: 'Bình thường' },
  { emoji: '😴', label: 'Mệt mỏi' },
  { emoji: '😰', label: 'Lo âu' },
  { emoji: '😢', label: 'Buồn bã' },
  { emoji: '😡', label: 'Tức giận' },
  { emoji: '🤯', label: 'Quá tải' },
];

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

    void loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const getSentimentDisplay = (label?: string | null) => {
    switch (label?.toLowerCase()) {
      case 'positive':
        return {
          title: 'Tích cực & Lạc quan',
          color: 'var(--color-success)',
          bg: 'var(--tint-sage)',
          border: 'rgba(58, 117, 88, 0.25)',
          icon: '😊',
          desc: 'Tâm trạng của bạn rất tốt! Những suy nghĩ tươi sáng này sẽ là nguồn năng lượng tuyệt vời giúp bạn vượt qua mọi thử thách.',
        };
      case 'neutral':
        return {
          title: 'Bình yên & Cân bằng',
          color: 'var(--color-info)',
          bg: 'var(--tint-blue)',
          border: 'rgba(66, 107, 138, 0.25)',
          icon: '😌',
          desc: 'Cảm xúc của bạn đang ở trạng thái hài hòa, cân bằng. Tiếp tục duy trì nhịp sống nhẹ nhàng và lắng nghe bản thân nhé.',
        };
      case 'negative':
        return {
          title: 'Căng thẳng & Mệt mỏi',
          color: 'var(--color-warning)',
          bg: 'var(--tint-terracotta)',
          border: 'rgba(161, 79, 64, 0.25)',
          icon: '😔',
          desc: 'Hệ thống nhận thấy bạn có thể đang cảm thấy áp lực hoặc mệt mỏi. Hãy dành vài phút thả lỏng tâm trí cùng các gợi ý thư giãn bên dưới nhé.',
        };
      case 'crisis':
        return {
          title: 'Cần hỗ trợ tinh thần',
          color: 'var(--color-crisis)',
          bg: 'var(--tint-crimson)',
          border: 'rgba(166, 50, 40, 0.3)',
          icon: '🆘',
          desc: 'Bạn đang trải qua cảm xúc căng thẳng tột độ. Đừng chịu đựng một mình, chúng mình luôn ở đây sẵn sàng lắng nghe và đồng hành cùng bạn.',
        };
      default:
        return {
          title: 'Đã lưu trữ an toàn',
          color: 'var(--color-primary)',
          bg: 'var(--tint-lavender)',
          border: 'rgba(103, 80, 164, 0.25)',
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

  const handleCreate = async (e?: React.FormEvent) => {
    if (e?.preventDefault) e.preventDefault();
    if (!content.trim()) {
      message.warning('Vui lòng chia sẻ đôi lời cảm xúc hoặc suy nghĩ của bạn');
      return;
    }

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
      let msg = 'Không thể lưu bài nhật ký. Vui lòng thử lại sau.';
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
    navigate(`/resources?open=${encodeURIComponent(r.id)}`);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Xóa bài nhật ký',
      content: 'Bạn có chắc chắn muốn xóa bài nhật ký này? Hành động này không thể hoàn tác.',
      okText: 'Xóa bài',
      okType: 'danger',
      cancelText: 'Hủy',
      centered: true,
      onOk: async () => {
        try {
          await journalApi.delete(id);
          setEntries((prev) => prev.filter((item) => item.id !== id));
          message.success('Đã xóa bài nhật ký thành công');
        } catch {
          message.error('Không thể xóa bài nhật ký');
        }
      },
    });
  };

  return (
    <div className="journal-container">
      {/* ─── Page Header ─── */}
      <div className="journal-header">
        <div className="journal-header__content">
          <h1 className="journal-header__title">
            <span className="journal-header__title-icon">
              <BookOpen size={26} />
            </span>
            Không gian dành cho cảm xúc của bạn
          </h1>
          <p className="journal-header__subtitle">
            Ghi lại những suy nghĩ, cảm xúc hay bất kỳ điều gì bạn muốn chia sẻ theo nhịp độ riêng của mình. Không gian này hoàn toàn an toàn và riêng tư.
          </p>
        </div>

        <div className="journal-header__security-badge" title="Nội dung nhật ký được mã hóa bằng thuật toán AES-256-GCM trước khi lưu vào cơ sở dữ liệu">
          <ShieldCheck size={16} />
          <span>Bảo mật AES-256-GCM</span>
        </div>
      </div>

      {/* ─── Main Grid Layout ─── */}
      <div className="journal-layout-grid">
        {/* Left Column: Create Form & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Write Form Card */}
          <div className="journal-write-card">
            <div className="journal-write-card__heading">
              <h2 className="journal-write-card__title">
                <Sparkles size={18} color="var(--color-primary)" />
                Viết suy nghĩ hôm nay
              </h2>
              <span className="journal-write-card__privacy-tag">
                <Lock size={13} /> Riêng tư tuyệt đối
              </span>
            </div>

            {/* Mood Selector */}
            <div className="journal-mood-section">
              <span className="journal-mood-label">
                Tâm trạng hiện tại của bạn thế nào?
              </span>
              <div className="journal-mood-options" role="radiogroup" aria-label="Chọn tâm trạng hiện tại">
                {EMOJI_OPTIONS.map((item) => {
                  const isSelected = moodEmoji === item.emoji;
                  return (
                    <button
                      key={item.emoji}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={item.label}
                      title={item.label}
                      onClick={() => setMoodEmoji(item.emoji)}
                      className={`journal-mood-btn ${isSelected ? 'journal-mood-btn--active' : ''}`}
                    >
                      {item.emoji}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Textarea Writing Pad */}
            <div className="journal-textarea-wrapper">
              <Input.TextArea
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Chia sẻ những cảm xúc, băn khoăn hay câu chuyện hôm nay của bạn... Không có đúng hay sai, hãy viết một cách tự nhiên nhất."
                maxLength={2000}
                showCount
                className="journal-textarea"
                aria-label="Nội dung nhật ký cá nhân"
              />
            </div>

            {/* Save Journal CTA */}
            <Button
              type="primary"
              size="large"
              loading={isSubmitting}
              onClick={() => handleCreate()}
              icon={<Sparkles size={17} />}
              className="journal-submit-btn"
            >
              {isSubmitting ? 'Đang mã hóa & Phân tích AI...' : 'Lưu nhật ký'}
            </Button>
          </div>

          {/* History Section */}
          <div className="journal-history-section">
            <div className="journal-history-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className="journal-history-title">
                  Lịch sử Nhật ký
                </h2>
                {entries.length > 0 && (
                  <span className="journal-history-badge">
                    {entries.length} bài viết
                  </span>
                )}
              </div>
              <Button
                icon={<RefreshCw size={14} />}
                onClick={fetchJournalEntries}
                size="small"
                style={{ borderRadius: '6px' }}
              >
                Làm mới
              </Button>
            </div>

            {loading ? (
              <LoadingSpinner message="Đang tải nhật ký của bạn..." />
            ) : entries.length === 0 ? (
              <div className="journal-empty-box">
                <div className="journal-empty-box__icon">
                  <BookOpen size={24} />
                </div>
                <p className="journal-empty-box__text">
                  Chưa có bài viết nhật ký nào. Hãy dành một vài phút viết ra những suy nghĩ đầu tiên của bạn ở khung phía trên nhé.
                </p>
              </div>
            ) : (
              <div className="journal-entries-list">
                {entries.map((item) => {
                  const sentiment = item.sentimentLabel?.toLowerCase();
                  const sentimentDisplay = getSentimentDisplay(item.sentimentLabel);
                  return (
                    <div key={item.id} className="journal-entry-card">
                      <div className="journal-entry-header">
                        <div className="journal-entry-meta">
                          <span className="journal-entry-mood" role="img" aria-label="Tâm trạng">
                            {item.moodEmoji || '📝'}
                          </span>
                          <span className="journal-entry-date">
                            {new Date(item.createdAt).toLocaleString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="journal-entry-delete-btn"
                          aria-label="Xóa bài nhật ký này"
                          title="Xóa bài nhật ký"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <p className="journal-entry-content">
                        {item.content}
                      </p>

                      {item.sentimentLabel && (
                        <div className="journal-entry-footer">
                          <div
                            className={`journal-sentiment-pill journal-sentiment-pill--${
                              sentiment === 'positive'
                                ? 'positive'
                                : sentiment === 'neutral'
                                ? 'neutral'
                                : sentiment === 'negative'
                                ? 'negative'
                                : sentiment === 'crisis'
                                ? 'crisis'
                                : 'neutral'
                            }`}
                          >
                            <Sparkles size={13} />
                            <span>
                              {sentimentDisplay.title}
                              {item.sentimentScore !== null && item.sentimentScore !== undefined
                                ? ` (${(item.sentimentScore * 100).toFixed(0)}%)`
                                : ''}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Suggested Relaxation Resources */}
        <div>
          <div className="journal-suggested-panel">
            <div className="journal-suggested-heading">
              <div className="journal-suggested-icon">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="journal-suggested-title">Gợi ý Thư giãn từ AI</h3>
              </div>
            </div>

            <p className="journal-suggested-desc">
              Dựa trên cảm xúc bài viết gần nhất của bạn, hệ thống gợi ý các phương pháp thư giãn phù hợp:
            </p>

            {resources.length === 0 ? (
              <div className="journal-suggested-empty">
                Viết một bài nhật ký mới để nhận những gợi ý thư giãn được cá nhân hóa cho bạn nhé!
              </div>
            ) : (
              <div className="journal-suggested-list">
                {resources.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => handleResourceClick(r)}
                    className="journal-suggested-card"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleResourceClick(r);
                    }}
                  >
                    <div className="journal-suggested-card__header">
                      <span className="journal-suggested-card__title">
                        {r.title}
                      </span>
                      <span className="journal-suggested-card__action">
                        Mở <ArrowRight size={13} />
                      </span>
                    </div>

                    <div className="journal-suggested-card__meta">
                      <span>{getCategoryDisplay(r.category).label}</span>
                      {r.durationSeconds && <span>⏱ {Math.round(r.durationSeconds / 60)} phút</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Modal 1: Hỗ trợ khẩn cấp khi nhận diện tâm trạng crisis ─── */}
      <Modal
        open={crisisModalOpen}
        onCancel={() => setCrisisModalOpen(false)}
        closable={true}
        maskClosable={false}
        centered
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-crisis)', fontSize: '18px' }}>
            <HeartHandshake size={22} />
            <span>Hỗ trợ tinh thần</span>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px 0 8px 0' }}>
          <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
            Mình rất tiếc khi bạn đang cảm thấy như vậy. Bạn không phải một mình, và luôn có người sẵn sàng lắng nghe bạn.
          </p>

          <div className="journal-hotline-box">
            <div className="journal-hotline-box__icon">
              <PhoneCall size={20} />
            </div>
            <div>
              <div className="journal-hotline-box__label">
                Đường dây nóng hỗ trợ khẩn cấp 24/7:
              </div>
              <div className="journal-hotline-box__number">
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
                  <strong style={{ color: 'var(--color-crisis)' }}>{crisisHotline}</strong> để được hỗ trợ kịp thời.
                </span>
              }
            />
          )}
        </div>
      </Modal>

      {/* ─── Modal 2: Popup Kết quả Phân tích AI & Danh mục Gợi ý Thư giãn ─── */}
      <Modal
        open={analysisModalOpen}
        onCancel={() => setAnalysisModalOpen(false)}
        width={560}
        style={{ maxWidth: 'calc(100vw - 24px)' }}
        centered
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '17px', color: 'var(--text-primary)' }}>
            <Sparkles size={20} color="var(--color-primary)" />
            <span>Kết quả Phân tích Cảm xúc & Gợi ý Thư giãn</span>
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
            style={{ borderRadius: '8px' }}
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
                  className="journal-analysis-sentiment-card"
                  style={{
                    background: sentiment.bg,
                    borderColor: sentiment.border,
                  }}
                >
                  <div className="journal-analysis-sentiment-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '28px' }}>{sentiment.icon}</span>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                          Trạng thái tâm trạng
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: sentiment.color }}>
                          {sentiment.title}
                        </div>
                      </div>
                    </div>

                    {latestAnalysis.entry.sentimentScore !== null && latestAnalysis.entry.sentimentScore !== undefined && (
                      <span className="journal-analysis-score-badge">
                        Chỉ số: {latestAnalysis.entry.sentimentScore > 0 ? '+' : ''}
                        {(latestAnalysis.entry.sentimentScore * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>

                  <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
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
                  borderRadius: '12px',
                  border: '1px solid rgba(166, 50, 40, 0.25)',
                  background: 'var(--tint-crimson)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <PhoneCall size={20} color="var(--color-crisis)" />
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--color-crisis)', fontWeight: 600 }}>
                      Đường dây nóng khẩn cấp:
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-crisis)' }}>
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
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {getCategoryDisplay(latestAnalysis.entry.suggestedResourceCategory).icon}{' '}
                  Gợi ý: {getCategoryDisplay(latestAnalysis.entry.suggestedResourceCategory).label}
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'var(--tint-lavender)',
                    color: 'var(--color-primary)',
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
                      className="journal-suggested-card"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleResourceClick(r);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                          <PlayCircle size={20} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: '13.5px',
                                color: 'var(--text-primary)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {r.title}
                            </div>
                            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              {r.type === 'AUDIO' ? 'Âm thanh' : r.type === 'VIDEO' ? 'Video' : 'Bài viết'}
                              {r.durationSeconds && ` • ${Math.round(r.durationSeconds / 60)} phút`}
                            </div>
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--color-primary)',
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
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px dashed var(--border-subtle)',
                    background: 'var(--bg-canvas)',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '13px',
                    lineHeight: 1.5,
                  }}
                >
                  🌱 Cảm xúc của bạn đang rất cân bằng và ổn định. Hãy tiếp tục lắng nghe bản thân hoặc ghé thăm kho tài nguyên để trải nghiệm các bài tập thư giãn nhé!
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
