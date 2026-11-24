import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { assessmentApi, type TestResultResponse } from '../api/assessment.api';
import { journalApi, type JournalEntry } from '../api/journal.api';
import {
  HeartPulse,
  BookOpen,
  MessageSquare,
  HeartHandshake,
  Coffee,
  Wind,
  X,
  ArrowRight,
  ClipboardCheck,
  PhoneCall,
} from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getEmergencyHotline } from '../utils/hotline';
import { VolunteerDashboard } from './volunteer/VolunteerDashboard';
import { MoodTrendChart } from '../components/dashboard/MoodTrendChart';
import './dashboard.css';

const getSeverityInfo = (level: string) => {
  switch (level) {
    case 'MINIMAL':
      return { label: 'Bình thường / Ổn định', color: 'var(--color-success)', bg: 'var(--tint-sage)' };
    case 'MILD':
      return { label: 'Mức độ nhẹ', color: 'var(--color-info)', bg: 'var(--tint-blue)' };
    case 'MODERATE':
      return { label: 'Mức độ vừa phải', color: 'var(--color-warning)', bg: 'var(--tint-terracotta)' };
    case 'MODERATELY_SEVERE':
      return { label: 'Khá nghiêm trọng', color: 'var(--color-warning)', bg: 'var(--tint-terracotta)' };
    case 'SEVERE':
      return { label: 'Cần chú ý hỗ trợ', color: 'var(--color-crisis)', bg: 'var(--tint-crimson)' };
    default:
      return { label: level, color: 'var(--color-primary)', bg: 'var(--tint-lavender)' };
  }
};

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isVolunteer = user?.role === 'VOLUNTEER';

  const [recentTests, setRecentTests] = useState<TestResultResponse[]>([]);
  const [recentJournals, setRecentJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [nudgeDismissed, setNudgeDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('psy_empathy_nudge_dismissed') === 'true';
  });

  const handleDismissNudge = () => {
    setNudgeDismissed(true);
    sessionStorage.setItem('psy_empathy_nudge_dismissed', 'true');
  };

  const hasNegativeJournal = recentJournals.some(
    (j) => j.sentimentLabel === 'negative' || j.sentimentLabel === 'crisis'
  );
  const hasHighStressTest = recentTests.some(
    (t) =>
      t.severityLevel === 'MODERATE' ||
      t.severityLevel === 'MODERATELY_SEVERE' ||
      t.severityLevel === 'SEVERE'
  );
  const showEmpathyNudge = !nudgeDismissed && (hasNegativeJournal || hasHighStressTest);

  useEffect(() => {
    if (isVolunteer) {
      return;
    }

    const fetchData = async () => {
      try {
        const [testsData, journalsData] = await Promise.all([
          assessmentApi.getHistory(1, 3).catch(() => ({ data: [], total: 0 })),
          journalApi.findAll(1, 3).catch(() => ({ data: [], total: 0 })),
        ]);
        setRecentTests(testsData.data || []);
        setRecentJournals(journalsData.data || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isVolunteer]);

  // Nếu người dùng là Tình nguyện viên (VOLUNTEER), hiển thị Bàn trực riêng của TNV
  if (isVolunteer) {
    return <VolunteerDashboard />;
  }

  if (loading) {
    return <LoadingSpinner message="Đang tải dữ liệu không gian chăm sóc..." />;
  }

  return (
    <div className="dashboard-container">
      {/* ─── 1. Welcome Banner ─── */}
      <section className="dashboard-welcome" aria-labelledby="welcome-title">
        <h1 id="welcome-title" className="dashboard-welcome__title">
          Xin chào, {user?.fullName || 'bạn'}! 👋
        </h1>
        <p className="dashboard-welcome__subtitle">
          Chào mừng bạn quay lại với PSYTHALIA. Hãy lắng nghe cảm xúc bản thân theo nhịp độ tự nhiên của mình.
          Hôm nay bạn có muốn dành ít phút để kiểm tra tâm trạng hoặc giãi bày tâm tư không?
        </p>
      </section>

      {/* ─── 2. Gentle Empathy Nudge (Gợi ý nâng đỡ cảm xúc) ─── */}
      {showEmpathyNudge && (
        <aside className="dashboard-nudge" role="status" aria-label="Gợi ý nâng đỡ tâm trạng">
          <div className="dashboard-nudge__header">
            <div className="dashboard-nudge__title-group">
              <div className="dashboard-nudge__icon" aria-hidden="true">
                <Coffee size={20} />
              </div>
              <h2 className="dashboard-nudge__title">
                PSYTHALIA đang ở đây cùng bạn 🌿
              </h2>
            </div>
            <button
              onClick={handleDismissNudge}
              title="Đóng thông báo"
              className="dashboard-nudge__close"
              aria-label="Đóng thông báo"
            >
              <X size={18} />
            </button>
          </div>

          <p className="dashboard-nudge__desc">
            Chúng mình nhận thấy những ngày gần đây có vẻ hơi nhiều áp lực với bạn. Hãy nhớ uống một ngụm nước ấm,
            thả lỏng vai và nghỉ ngơi một chút nhé. Khi bạn cần một người lắng nghe, đội ngũ luôn sẵn sàng sẻ chia.
          </p>

          <div className="dashboard-nudge__actions">
            <Link to="/chat" className="dashboard-nudge__btn-primary">
              <MessageSquare size={14} />
              Tâm sự với Tình nguyện viên
            </Link>
            <Link to="/resources" className="dashboard-nudge__btn-secondary">
              <Wind size={14} />
              Thư giãn & Thở sâu
            </Link>
          </div>
        </aside>
      )}

      {/* ─── 3. Volunteer Application Banner for Regular USER ─── */}
      {user?.role === 'USER' && (
        <section className="dashboard-volunteer-banner" aria-label="Đăng ký tình nguyện viên">
          <div className="dashboard-volunteer-banner__left">
            <div className="dashboard-volunteer-banner__icon" aria-hidden="true">
              <HeartHandshake size={22} />
            </div>
            <div>
              <h3 className="dashboard-volunteer-banner__title">
                Đồng hành cùng cộng đồng PSYTHALIA
              </h3>
              <p className="dashboard-volunteer-banner__desc">
                Bạn mong muốn chia sẻ sự thấu cảm và hỗ trợ tâm lý ban đầu cho các bạn sinh viên? Hãy đăng ký làm Tình nguyện viên.
              </p>
            </div>
          </div>
          <Link to="/volunteer/apply" className="dashboard-volunteer-banner__cta">
            Đăng ký làm TNV <ArrowRight size={14} />
          </Link>
        </section>
      )}

      {/* ─── 4. Four Core Action Cards ─── */}
      <section className="dashboard-actions-grid" aria-label="Các chức năng chăm sóc chính">
        {/* Card 1: Đánh giá tâm lý */}
        <Link to="/assessments" className="dashboard-action-card">
          <div className="dashboard-action-card__header">
            <div className="dashboard-action-card__icon-wrap dashboard-action-card__icon-wrap--lavender">
              <ClipboardCheck size={22} />
            </div>
            <h2 className="dashboard-action-card__title">Đánh giá Tâm lý</h2>
          </div>
          <p className="dashboard-action-card__desc">
            Sàng lọc định kỳ với bài test PHQ-9 (Trầm cảm) hoặc GAD-7 (Lo âu) theo chuẩn mực quốc tế.
          </p>
          <div className="dashboard-action-card__footer">
            <span className="dashboard-action-card__tag">Sàng lọc định kỳ</span>
            <span className="dashboard-action-card__cta">Thực hiện <ArrowRight size={13} /></span>
          </div>
        </Link>

        {/* Card 2: Nhật ký cá nhân */}
        <Link to="/journal" className="dashboard-action-card">
          <div className="dashboard-action-card__header">
            <div className="dashboard-action-card__icon-wrap dashboard-action-card__icon-wrap--sage">
              <BookOpen size={22} />
            </div>
            <h2 className="dashboard-action-card__title">Nhật ký Cá nhân</h2>
          </div>
          <p className="dashboard-action-card__desc">
            Không gian giãi bày riêng tư tuyệt đối, dữ liệu mã hóa an toàn kết hợp trợ lý AI thấu cảm.
          </p>
          <div className="dashboard-action-card__footer">
            <span className="dashboard-action-card__tag">Mã hóa an toàn</span>
            <span className="dashboard-action-card__cta">Viết nhật ký <ArrowRight size={13} /></span>
          </div>
        </Link>

        {/* Card 3: Tư vấn trực tiếp */}
        <Link to="/chat" className="dashboard-action-card">
          <div className="dashboard-action-card__header">
            <div className="dashboard-action-card__icon-wrap dashboard-action-card__icon-wrap--blue">
              <MessageSquare size={22} />
            </div>
            <h2 className="dashboard-action-card__title">Hỗ trợ Trực tiếp 1-1</h2>
          </div>
          <p className="dashboard-action-card__desc">
            Trò chuyện trực tuyến theo thời gian thực với Tình nguyện viên tâm lý trong không gian bảo mật.
          </p>
          <div className="dashboard-action-card__footer">
            <span className="dashboard-action-card__tag">Đồng hành 1-1</span>
            <span className="dashboard-action-card__cta">Kết nối ngay <ArrowRight size={13} /></span>
          </div>
        </Link>

        {/* Card 4: Thư giãn & Tài nguyên */}
        <Link to="/resources" className="dashboard-action-card">
          <div className="dashboard-action-card__header">
            <div className="dashboard-action-card__icon-wrap dashboard-action-card__icon-wrap--terracotta">
              <Wind size={22} />
            </div>
            <h2 className="dashboard-action-card__title">Thư giãn & Thở sâu</h2>
          </div>
          <p className="dashboard-action-card__desc">
            Thực hành các kỹ thuật thở 4-7-8, âm thanh thiên nhiên êm dịu và bài tập điều hòa cảm xúc tức thời.
          </p>
          <div className="dashboard-action-card__footer">
            <span className="dashboard-action-card__tag">Tự điều hòa</span>
            <span className="dashboard-action-card__cta">Khám phá <ArrowRight size={13} /></span>
          </div>
        </Link>
      </section>

      {/* ─── 5. Mood Trend Chart (PB-11) ─── */}
      <section aria-label="Biểu đồ xu hướng tâm trạng">
        <MoodTrendChart />
      </section>

      {/* ─── 6. Recent Activity Panels (Assessments & Journals) ─── */}
      <section className="dashboard-content-grid" aria-label="Hoạt động gần đây">
        {/* Recent Assessment Results */}
        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h3 className="dashboard-panel__title">Kết quả Đánh giá gần đây</h3>
            <Link to="/assessments" className="dashboard-panel__link">Xem tất cả</Link>
          </div>

          {recentTests.length === 0 ? (
            <div className="dashboard-panel__empty">
              <HeartPulse size={32} style={{ color: 'var(--color-primary)', opacity: 0.7 }} />
              <span>Bạn chưa thực hiện bài đánh giá nào.</span>
              <Link to="/assessments" className="dashboard-panel__empty-btn">
                Làm bài đánh giá đầu tiên <ArrowRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="dashboard-panel__list">
              {recentTests.map((t) => {
                const severityInfo = getSeverityInfo(t.severityLevel);
                return (
                  <div key={t.id} className="dashboard-panel__item">
                    <div>
                      <div className="dashboard-panel__item-title">
                        {severityInfo.label} (Điểm: {t.totalScore})
                      </div>
                      <div className="dashboard-panel__item-date">
                        {(t.takenAt || t.createdAt)
                          ? new Date(t.takenAt || t.createdAt!).toLocaleDateString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                          : ''}
                      </div>
                    </div>
                    <span
                      className="dashboard-panel__severity-badge"
                      style={{
                        background: severityInfo.bg,
                        color: severityInfo.color,
                      }}
                    >
                      {severityInfo.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Journal Entries */}
        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <h3 className="dashboard-panel__title">Nhật ký gần đây</h3>
            <Link to="/journal" className="dashboard-panel__link">Xem tất cả</Link>
          </div>

          {recentJournals.length === 0 ? (
            <div className="dashboard-panel__empty">
              <BookOpen size={32} style={{ color: 'var(--color-secondary)', opacity: 0.7 }} />
              <span>Chưa có nhật ký nào được viết.</span>
              <Link to="/journal" className="dashboard-panel__empty-btn">
                Viết dòng nhật ký đầu tiên <ArrowRight size={12} />
              </Link>
            </div>
          ) : (
            <div className="dashboard-panel__list">
              {recentJournals.map((j) => (
                <div key={j.id} className="dashboard-panel__item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <span className="dashboard-panel__item-title">
                      {j.moodEmoji || '📝'} {j.sentimentLabel ? `[AI: ${j.sentimentLabel}]` : ''}
                    </span>
                    <span className="dashboard-panel__item-date">
                      {new Date(j.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    marginTop: '2px',
                  }}>
                    {j.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── 7. Emergency Hotline Notice ─── */}
      <aside className="dashboard-hotline" role="complementary" aria-label="Hỗ trợ khẩn cấp">
        <div className="dashboard-hotline__icon" aria-hidden="true">
          <PhoneCall size={20} />
        </div>
        <div className="dashboard-hotline__text">
          <strong>Cần hỗ trợ khẩn cấp?</strong> Nếu bạn đang trải qua khủng hoảng tâm lý nghiêm trọng hoặc có ý định tự gây hại,
          hãy gọi ngay đường dây nóng: <strong className="dashboard-hotline__number">{getEmergencyHotline()}</strong> hoặc số cấp cứu y tế <strong>115</strong>.
        </div>
      </aside>
    </div>
  );
};
