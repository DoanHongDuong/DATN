import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { assessmentApi, type TestResultResponse } from '../api/assessment.api';
import { journalApi, type JournalEntry } from '../api/journal.api';
import { HeartPulse, BookOpen, MessageSquare, ShieldAlert, HeartHandshake } from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [recentTests, setRecentTests] = useState<TestResultResponse[]>([]);
  const [recentJournals, setRecentJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
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
  }, []);

  if (loading) {
    return <LoadingSpinner message="Đang tải dữ liệu trang tổng quan..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Welcome Banner */}
      <div style={{
        padding: '28px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(170, 59, 255, 0.15) 0%, rgba(107, 33, 168, 0.1) 100%)',
        border: '1px solid var(--accent-border)'
      }}>
        <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-h)' }}>
          Xin chào, {user?.fullName}! 👋
        </h2>
        <p style={{ color: 'var(--text)', margin: 0, fontSize: '15px' }}>
          Hôm nay cảm xúc của bạn thế nào? Hãy dành ít phút để kiểm tra tâm trạng hoặc thực hiện bài đánh giá nhé.
        </p>
      </div>

      {/* Volunteer Application Entry Point for USER */}
      {user?.role === 'USER' && (
        <div style={{
          padding: '20px 24px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.05) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}>
              <HeartHandshake size={22} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--text-h)' }}>
                Đồng hành cùng cộng đồng MindCare
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)' }}>
                Bạn có chuyên môn hoặc mong muốn lắng nghe, hỗ trợ tâm lý? Đăng ký trở thành Tình nguyện viên ngay hôm nay.
              </p>
            </div>
          </div>
          <Link
            to="/volunteer/apply"
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: '#10b981',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Đăng ký làm TNV
          </Link>
        </div>
      )}

      {/* Quick Action Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        <Link to="/assessments" style={{
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          background: 'var(--code-bg)',
          textDecoration: 'none',
          transition: 'transform 0.2s',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HeartPulse size={24} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-h)' }}>Đánh giá Tâm lý</h3>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)' }}>
            Làm bài trắc nghiệm sàng lọc PHQ-9 (Trầm cảm) hoặc GAD-7 (Lo âu).
          </p>
        </Link>

        <Link to="/journal" style={{
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          background: 'var(--code-bg)',
          textDecoration: 'none',
          transition: 'transform 0.2s',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={24} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-h)' }}>Nhật ký Cá nhân</h3>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)' }}>
            Ghi chép cảm xúc riêng tư được bảo vệ bằng mã hóa & phân tích AI.
          </p>
        </Link>

        <Link to="/chat" style={{
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          background: 'var(--code-bg)',
          textDecoration: 'none',
          transition: 'transform 0.2s',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={24} color="var(--accent)" />
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-h)' }}>Hỗ trợ Trực tiếp</h3>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)' }}>
            Yêu cầu kết nối trò chuyện trực tiếp 1-1 cùng Tình nguyện viên.
          </p>
        </Link>
      </div>

      {/* Main Content Grid: Recent Assessments & Recent Journals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Recent Assessment Results */}
        <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-h)' }}>Kết quả Đánh giá gần đây</h3>
            <Link to="/assessments" style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>Xem tất cả</Link>
          </div>

          {recentTests.length === 0 ? (
            <p style={{ color: 'var(--text)', fontSize: '14px' }}>Bạn chưa thực hiện bài đánh giá nào.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentTests.map((t) => (
                <div key={t.id} style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'var(--code-bg)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-h)' }}>
                      Mức độ: {t.severityLevel} (Điểm: {t.totalScore})
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text)' }}>
                      {new Date(t.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: t.severityLevel === 'SEVERE' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: t.severityLevel === 'SEVERE' ? '#ef4444' : '#10b981',
                    fontWeight: 600
                  }}>
                    {t.severityLevel}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Journal Entries */}
        <div style={{ padding: '24px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-h)' }}>Nhật ký gần đây</h3>
            <Link to="/journal" style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>Xem tất cả</Link>
          </div>

          {recentJournals.length === 0 ? (
            <p style={{ color: 'var(--text)', fontSize: '14px' }}>Chưa có nhật ký nào được viết.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentJournals.map((j) => (
                <div key={j.id} style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'var(--code-bg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>
                      {j.moodEmoji || '📝'} {j.sentimentLabel ? `[AI: ${j.sentimentLabel}]` : ''}
                    </span>
                    <span style={{ color: 'var(--text)', fontSize: '12px' }}>
                      {new Date(j.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {j.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Emergency Hotline Notice */}
      <div style={{
        padding: '16px 20px',
        borderRadius: '12px',
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <ShieldAlert size={24} color="#ef4444" />
        <div style={{ fontSize: '14px', color: 'var(--text-h)' }}>
          <strong>Khẩn cấp?</strong> Nếu bạn đang gặp khủng hoảng tâm lý nghiêm trọng, hãy gọi đường dây nóng hỗ trợ khẩn cấp: <strong>111</strong> hoặc <strong>1900 599 930</strong>.
        </div>
      </div>
    </div>
  );
};
