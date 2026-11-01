import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  MessageSquare,
  HeartPulse,
  BookOpen,
  Sparkles,
  UserCheck,
  Star,
  Activity,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { AdminHeaderNav } from './AdminHeaderNav';
import { adminApi, type SystemStats } from '../../api/admin.api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminStatsPage: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load system stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getStats()
      .then((data) => {
        if (!cancelled) {
          setStats(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load system stats:', err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading) {
    return <LoadingSpinner message="Đang tải dữ liệu thống kê hệ thống..." />;
  }

  const u = stats?.users;
  const s = stats?.sessions;
  const a = stats?.assessments;
  const j = stats?.journals;
  const activities = stats?.recentActivity || [];

  // SVG dimensions for 7-day activity bar chart
  const maxDayCount = Math.max(
    1,
    ...activities.map((act) => Math.max(act.sessions, act.assessments, act.journals))
  );

  return (
    <div>
      <AdminHeaderNav />

      {/* Action / Refresh Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-h)' }}>
            Thống kê & Giám sát Hoạt động Toàn hệ thống (PB-35)
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)' }}>
            Dữ liệu tổng hợp thời gian thực từ cơ sở dữ liệu MindCare
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--code-bg)',
            color: 'var(--text-h)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: refreshing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Làm mới số liệu
        </button>
      </div>

      {/* Top 4 Primary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Card 1: Users */}
        <div style={{
          padding: '20px',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          background: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>Người dùng hệ thống</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-h)' }}>
            {u?.total || 0}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text)' }}>Thành viên:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>{u?.members || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text)' }}>Tình nguyện viên:</span>
              <span style={{ fontWeight: 600, color: '#10b981' }}>
                {u?.volunteers || 0} ({u?.onlineVolunteers || 0} đang online)
              </span>
            </div>
            {u?.pendingVolunteers ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b', fontWeight: 600 }}>
                <span>Chờ duyệt:</span>
                <span>{u.pendingVolunteers} hồ sơ</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Card 2: Chat Sessions */}
        <div style={{
          padding: '20px',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          background: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>Phiên Tư vấn Trực tiếp</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(170, 59, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <MessageSquare size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-h)' }}>
              {s?.total || 0}
            </div>
            {s && s.totalFeedbacks > 0 && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '13px', color: '#f59e0b', fontWeight: 600 }}>
                <Star size={14} fill="#f59e0b" /> {s.averageRating} / 5
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text)' }}>Đang chờ tiếp nhận:</span>
              <span style={{ fontWeight: 600, color: (s?.waiting || 0) > 0 ? '#ef4444' : 'var(--text-h)' }}>
                {s?.waiting || 0}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text)' }}>Đang hỗ trợ (Active):</span>
              <span style={{ fontWeight: 600, color: '#10b981' }}>{s?.active || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text)' }}>Đã hoàn tất:</span>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{s?.closed || 0}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Assessments */}
        <div style={{
          padding: '20px',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          background: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>Lượt Đánh giá Tâm lý</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <HeartPulse size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-h)' }}>
            {a?.total || 0}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#10b981' }}>Nhẹ / Tối thiểu:</span>
              <span style={{ fontWeight: 600 }}>{(a?.severityDistribution.minimal || 0) + (a?.severityDistribution.mild || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#f59e0b' }}>Trung bình:</span>
              <span style={{ fontWeight: 600 }}>{a?.severityDistribution.moderate || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#ef4444' }}>Nặng / Khá nặng:</span>
              <span style={{ fontWeight: 600 }}>{(a?.severityDistribution.moderatelySevere || 0) + (a?.severityDistribution.severe || 0)}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Journals */}
        <div style={{
          padding: '20px',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          background: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>Nhật ký & Khủng hoảng</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-h)' }}>
            {j?.total || 0}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#10b981' }}>Tích cực:</span>
              <span style={{ fontWeight: 600 }}>{j?.sentimentDistribution.positive || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text)' }}>Cân bằng:</span>
              <span style={{ fontWeight: 600 }}>{j?.sentimentDistribution.neutral || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#ef4444' }}>Tiêu cực / Khủng hoảng:</span>
              <span style={{ fontWeight: 600 }}>{(j?.sentimentDistribution.negative || 0) + (j?.sentimentDistribution.crisis || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Grid: 7-Day Activity Chart & Severity / Sentiment Distributions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* 7-Day Activity Bar Chart */}
        <div style={{
          padding: '24px',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          background: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--text-h)' }}>
                Hoạt động Hệ thống 7 Ngày qua
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text)' }}>
                Tương tác theo ngày: Phiên tư vấn, Bài kiểm tra, Bài viết nhật ký
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--accent)' }} /> Phiên chat
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#ef4444' }} /> Trắc nghiệm
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#10b981' }} /> Nhật ký
              </span>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg viewBox="0 0 600 200" style={{ width: '100%', height: 'auto', minWidth: '460px' }}>
              {/* Horizontal grid lines */}
              <line x1="40" y1="30" x2="580" y2="30" stroke="var(--border)" strokeDasharray="3 3" strokeOpacity="0.4" />
              <line x1="40" y1="95" x2="580" y2="95" stroke="var(--border)" strokeDasharray="3 3" strokeOpacity="0.4" />
              <line x1="40" y1="160" x2="580" y2="160" stroke="var(--border)" strokeOpacity="0.8" />

              {activities.map((act, idx) => {
                const groupWidth = 65;
                const startX = 60 + idx * 75;
                const barWidth = 14;
                const baseHeight = 130;

                const sHeight = maxDayCount > 0 ? (act.sessions / maxDayCount) * baseHeight : 0;
                const aHeight = maxDayCount > 0 ? (act.assessments / maxDayCount) * baseHeight : 0;
                const jHeight = maxDayCount > 0 ? (act.journals / maxDayCount) * baseHeight : 0;

                const [yStr, mStr, dStr] = act.date.split('-');
                const label = yStr && mStr && dStr ? `${dStr}/${mStr}` : act.date;

                return (
                  <g key={act.date}>
                    {/* Bar: Sessions */}
                    <rect
                      x={startX}
                      y={160 - sHeight}
                      width={barWidth}
                      height={Math.max(2, sHeight)}
                      rx="3"
                      fill="var(--accent)"
                      fillOpacity="0.85"
                    />
                    {/* Bar: Assessments */}
                    <rect
                      x={startX + barWidth + 4}
                      y={160 - aHeight}
                      width={barWidth}
                      height={Math.max(2, aHeight)}
                      rx="3"
                      fill="#ef4444"
                      fillOpacity="0.85"
                    />
                    {/* Bar: Journals */}
                    <rect
                      x={startX + (barWidth + 4) * 2}
                      y={160 - jHeight}
                      width={barWidth}
                      height={Math.max(2, jHeight)}
                      rx="3"
                      fill="#10b981"
                      fillOpacity="0.85"
                    />

                    {/* X-axis date label */}
                    <text
                      x={startX + groupWidth / 2 - 8}
                      y="180"
                      textAnchor="middle"
                      fontSize="11"
                      fill="var(--text)"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Severity & Mental Health Distribution breakdown */}
        <div style={{
          padding: '24px',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          background: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--text-h)' }}>
              Phân loại Mức độ Tâm lý (PHQ-9 / GAD-7)
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text)' }}>
              Tỷ trọng sàng lọc mức độ lo âu & trầm cảm của người dùng
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Tối thiểu (Minimal)', count: a?.severityDistribution.minimal || 0, color: '#10b981' },
              { label: 'Nhẹ (Mild)', count: a?.severityDistribution.mild || 0, color: '#3b82f6' },
              { label: 'Trung bình (Moderate)', count: a?.severityDistribution.moderate || 0, color: '#f59e0b' },
              { label: 'Khá nặng (Moderately Severe)', count: a?.severityDistribution.moderatelySevere || 0, color: '#f97316' },
              { label: 'Nghiêm trọng (Severe)', count: a?.severityDistribution.severe || 0, color: '#ef4444' },
            ].map((item) => {
              const totalA = a?.total || 1;
              const pct = a?.total ? Math.round((item.count / totalA) * 100) : 0;
              return (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-h)', fontWeight: 500 }}>{item.label}</span>
                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>{item.count} ({pct}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '7px', borderRadius: '4px', background: 'var(--code-bg)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <Link
          to="/admin/volunteers"
          style={{
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            background: 'var(--code-bg)',
            textDecoration: 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <UserCheck size={20} color="var(--accent)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-h)' }}>Duyệt Hồ sơ TNV</div>
              <div style={{ fontSize: '12px', color: (u?.pendingVolunteers || 0) > 0 ? '#f59e0b' : 'var(--text)' }}>
                {(u?.pendingVolunteers || 0) > 0 ? `${u?.pendingVolunteers} hồ sơ đang chờ duyệt` : 'Tất cả đã xử lý'}
              </div>
            </div>
          </div>
          <ArrowRight size={16} color="var(--text)" />
        </Link>

        <Link
          to="/admin/users"
          style={{
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            background: 'var(--code-bg)',
            textDecoration: 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={20} color="#3b82f6" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-h)' }}>Quản lý Người dùng</div>
              <div style={{ fontSize: '12px', color: 'var(--text)' }}>{u?.total || 0} tài khoản</div>
            </div>
          </div>
          <ArrowRight size={16} color="var(--text)" />
        </Link>

        <Link
          to="/admin/resources"
          style={{
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            background: 'var(--code-bg)',
            textDecoration: 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Sparkles size={20} color="#10b981" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-h)' }}>Tài nguyên Thư giãn</div>
              <div style={{ fontSize: '12px', color: 'var(--text)' }}>{stats?.resources.total || 0} tài nguyên</div>
            </div>
          </div>
          <ArrowRight size={16} color="var(--text)" />
        </Link>

        <Link
          to="/admin/audit-logs"
          style={{
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            background: 'var(--code-bg)',
            textDecoration: 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity size={20} color="#f59e0b" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-h)' }}>Nhật ký Kiểm toán</div>
              <div style={{ fontSize: '12px', color: 'var(--text)' }}>Audit logs & Hành vi</div>
            </div>
          </div>
          <ArrowRight size={16} color="var(--text)" />
        </Link>
      </div>
    </div>
  );
};
