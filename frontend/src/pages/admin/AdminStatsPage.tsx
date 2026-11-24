import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'antd';
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
  AlertCircle,
} from 'lucide-react';
import { AdminHeaderNav } from './AdminHeaderNav';
import { adminApi, type SystemStats } from '../../api/admin.api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import './admin.css';

export const AdminStatsPage: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load system stats:', err);
      setError('Không thể tải dữ liệu thống kê hệ thống. Vui lòng thử lại.');
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
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to load system stats:', err);
          setError('Không thể tải dữ liệu thống kê hệ thống. Vui lòng thử lại.');
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

  const maxDayCount = Math.max(
    1,
    ...activities.map((act) => Math.max(act.sessions, act.assessments, act.journals))
  );

  return (
    <div className="admin-page-container">
      <AdminHeaderNav />

      {error && (
        <div className="admin-error-box" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} color="var(--color-crisis)" />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{error}</span>
          </div>
          <Button size="small" onClick={handleRefresh} loading={refreshing}>
            Thử lại
          </Button>
        </div>
      )}

      {/* Action / Refresh Bar */}
      <div className="admin-section-bar">
        <div>
          <h2 className="admin-section-title">Thống kê & Giám sát Hoạt động Toàn hệ thống</h2>
          <p className="admin-section-subtitle">
            Dữ liệu tổng hợp thời gian thực từ cơ sở dữ liệu PSYTHALIA
          </p>
        </div>
        <Button
          icon={<RefreshCw size={14} />}
          onClick={handleRefresh}
          loading={refreshing}
        >
          Làm mới số liệu
        </Button>
      </div>

      {/* Top 4 Primary KPI Cards */}
      <div className="admin-kpi-grid">
        {/* Card 1: Users */}
        <article className="admin-kpi-card">
          <div className="admin-kpi-card__top">
            <span className="admin-kpi-card__label">Người dùng hệ thống</span>
            <div
              className="admin-kpi-card__icon"
              style={{ background: 'var(--tint-blue)', color: 'var(--color-info)' }}
              aria-hidden="true"
            >
              <Users size={18} />
            </div>
          </div>
          <div className="admin-kpi-card__value">{u?.total || 0}</div>
          <div className="admin-kpi-card__breakdown">
            <div className="admin-kpi-row">
              <span style={{ color: 'var(--text-secondary)' }}>Người dùng:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u?.members || 0}</span>
            </div>
            <div className="admin-kpi-row">
              <span style={{ color: 'var(--text-secondary)' }}>Tình nguyện viên:</span>
              <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                {u?.volunteers || 0} ({u?.onlineVolunteers || 0} online)
              </span>
            </div>
            {u?.pendingVolunteers ? (
              <div className="admin-kpi-row" style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
                <span>Hồ sơ chờ duyệt:</span>
                <span>{u.pendingVolunteers} hồ sơ</span>
              </div>
            ) : null}
          </div>
        </article>

        {/* Card 2: Chat Sessions */}
        <article className="admin-kpi-card">
          <div className="admin-kpi-card__top">
            <span className="admin-kpi-card__label">Phiên Tư vấn Trực tiếp</span>
            <div
              className="admin-kpi-card__icon"
              style={{ background: 'var(--tint-lavender)', color: 'var(--color-primary)' }}
              aria-hidden="true"
            >
              <MessageSquare size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <div className="admin-kpi-card__value">{s?.total || 0}</div>
            {s && s.totalFeedbacks > 0 && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '13px',
                  color: 'var(--color-warning)',
                  fontWeight: 600,
                }}
              >
                <Star size={14} fill="var(--color-warning)" /> {s.averageRating} / 5
              </div>
            )}
          </div>
          <div className="admin-kpi-card__breakdown">
            <div className="admin-kpi-row">
              <span style={{ color: 'var(--text-secondary)' }}>Đang chờ tiếp nhận:</span>
              <span
                style={{
                  fontWeight: 600,
                  color: (s?.waiting || 0) > 0 ? 'var(--color-crisis)' : 'var(--text-primary)',
                }}
              >
                {s?.waiting || 0}
              </span>
            </div>
            <div className="admin-kpi-row">
              <span style={{ color: 'var(--text-secondary)' }}>Đang hỗ trợ:</span>
              <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>{s?.active || 0}</span>
            </div>
            <div className="admin-kpi-row">
              <span style={{ color: 'var(--text-secondary)' }}>Đã hoàn tất:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{s?.closed || 0}</span>
            </div>
          </div>
        </article>

        {/* Card 3: Assessments */}
        <article className="admin-kpi-card">
          <div className="admin-kpi-card__top">
            <span className="admin-kpi-card__label">Lượt Đánh giá Tâm lý</span>
            <div
              className="admin-kpi-card__icon"
              style={{ background: 'var(--tint-crimson)', color: 'var(--color-crisis)' }}
              aria-hidden="true"
            >
              <HeartPulse size={18} />
            </div>
          </div>
          <div className="admin-kpi-card__value">{a?.total || 0}</div>
          <div className="admin-kpi-card__breakdown">
            <div className="admin-kpi-row">
              <span style={{ color: 'var(--color-success)' }}>Ổn định / Nhẹ:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {(a?.severityDistribution.minimal || 0) + (a?.severityDistribution.mild || 0)}
              </span>
            </div>
            <div className="admin-kpi-row">
              <span style={{ color: 'var(--color-warning)' }}>Trung bình:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {a?.severityDistribution.moderate || 0}
              </span>
            </div>
            <div className="admin-kpi-row">
              <span style={{ color: 'var(--color-crisis)' }}>Cần chú ý / Nghiêm trọng:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {(a?.severityDistribution.moderatelySevere || 0) + (a?.severityDistribution.severe || 0)}
              </span>
            </div>
          </div>
        </article>

        {/* Card 4: Journals */}
        <article className="admin-kpi-card">
          <div className="admin-kpi-card__top">
            <span className="admin-kpi-card__label">Nhật ký & Tín hiệu An toàn</span>
            <div
              className="admin-kpi-card__icon"
              style={{ background: 'var(--tint-sage)', color: 'var(--color-secondary)' }}
              aria-hidden="true"
            >
              <BookOpen size={18} />
            </div>
          </div>
          <div className="admin-kpi-card__value">{j?.total || 0}</div>
          <div className="admin-kpi-card__breakdown">
            <div className="admin-kpi-row">
              <span style={{ color: 'var(--color-success)' }}>Tích cực:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {j?.sentimentDistribution.positive || 0}
              </span>
            </div>
            <div className="admin-kpi-row">
              <span style={{ color: 'var(--text-secondary)' }}>Cân bằng:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {j?.sentimentDistribution.neutral || 0}
              </span>
            </div>
            <div className="admin-kpi-row">
              <span style={{ color: 'var(--color-crisis)' }}>Cần quan tâm / Khủng hoảng:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {(j?.sentimentDistribution.negative || 0) + (j?.sentimentDistribution.crisis || 0)}
              </span>
            </div>
          </div>
        </article>
      </div>

      {/* Middle Grid: 7-Day Activity Chart & Severity Distributions */}
      <div className="admin-charts-grid">
        {/* 7-Day Activity Bar Chart */}
        <section className="admin-chart-card" aria-label="Biểu đồ hoạt động hệ thống 7 ngày qua">
          <div className="admin-chart-header">
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--text-primary)' }}>
                Hoạt động Hệ thống 7 Ngày qua
              </h3>
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                Tương tác theo ngày: Phiên tư vấn, Bài kiểm tra, Nhật ký
              </p>
            </div>
            <div className="admin-chart-legend">
              <span className="admin-legend-item">
                <span className="admin-legend-dot" style={{ background: 'var(--color-primary)' }} /> Phiên chat
              </span>
              <span className="admin-legend-item">
                <span className="admin-legend-dot" style={{ background: 'var(--color-crisis)' }} /> Đánh giá
              </span>
              <span className="admin-legend-item">
                <span className="admin-legend-dot" style={{ background: 'var(--color-secondary)' }} /> Nhật ký
              </span>
            </div>
          </div>

          <div style={{ width: '100%', overflowX: 'auto' }}>
            {activities.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                Chưa có dữ liệu hoạt động trong 7 ngày gần nhất.
              </div>
            ) : (
              <svg viewBox="0 0 600 200" style={{ width: '100%', height: 'auto', minWidth: '420px' }} role="img" aria-label="Biểu đồ cột hoạt động 7 ngày">
                <line x1="40" y1="30" x2="580" y2="30" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <line x1="40" y1="95" x2="580" y2="95" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <line x1="40" y1="160" x2="580" y2="160" stroke="var(--border-strong)" />

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
                      <rect
                        x={startX}
                        y={160 - sHeight}
                        width={barWidth}
                        height={Math.max(2, sHeight)}
                        rx="3"
                        fill="var(--color-primary)"
                        fillOpacity="0.88"
                      />
                      <rect
                        x={startX + barWidth + 4}
                        y={160 - aHeight}
                        width={barWidth}
                        height={Math.max(2, aHeight)}
                        rx="3"
                        fill="var(--color-crisis)"
                        fillOpacity="0.85"
                      />
                      <rect
                        x={startX + (barWidth + 4) * 2}
                        y={160 - jHeight}
                        width={barWidth}
                        height={Math.max(2, jHeight)}
                        rx="3"
                        fill="var(--color-secondary)"
                        fillOpacity="0.88"
                      />
                      <text
                        x={startX + groupWidth / 2 - 8}
                        y="180"
                        textAnchor="middle"
                        fontSize="11"
                        fill="var(--text-secondary)"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </section>

        {/* Severity Distribution breakdown */}
        <section className="admin-chart-card" aria-label="Phân loại mức độ sàng lọc tâm lý">
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: 'var(--text-primary)' }}>
              Phân loại Mức độ Tâm lý (PHQ-9 / GAD-7)
            </h3>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Tỷ trọng sàng lọc tổng hợp ẩn danh trên toàn hệ thống
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Ổn định / Tối thiểu (Minimal)', count: a?.severityDistribution.minimal || 0, color: 'var(--color-success)' },
              { label: 'Mức độ nhẹ (Mild)', count: a?.severityDistribution.mild || 0, color: 'var(--color-info)' },
              { label: 'Mức độ vừa (Moderate)', count: a?.severityDistribution.moderate || 0, color: 'var(--color-warning)' },
              { label: 'Khá nghiêm trọng (Moderately Severe)', count: a?.severityDistribution.moderatelySevere || 0, color: 'var(--color-warning)' },
              { label: 'Cần chú ý hỗ trợ (Severe)', count: a?.severityDistribution.severe || 0, color: 'var(--color-crisis)' },
            ].map((item) => {
              const totalA = a?.total || 1;
              const pct = a?.total ? Math.round((item.count / totalA) * 100) : 0;
              return (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px', gap: '8px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.label}</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      borderRadius: '4px',
                      background: 'var(--bg-canvas)',
                      border: '1px solid var(--border-subtle)',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: '4px', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Quick Action Navigation Grid */}
      <nav className="admin-quick-grid" aria-label="Truy cập nhanh các phân hệ quản trị">
        <Link to="/admin/volunteers" className="admin-quick-card">
          <div className="admin-quick-card__left">
            <UserCheck size={20} color="var(--color-primary)" aria-hidden="true" />
            <div>
              <div className="admin-quick-card__title">Duyệt Hồ sơ TNV</div>
              <div
                className="admin-quick-card__meta"
                style={{ color: (u?.pendingVolunteers || 0) > 0 ? 'var(--color-warning)' : undefined, fontWeight: (u?.pendingVolunteers || 0) > 0 ? 600 : undefined }}
              >
                {(u?.pendingVolunteers || 0) > 0 ? `${u?.pendingVolunteers} hồ sơ chờ duyệt` : 'Tất cả đã xử lý'}
              </div>
            </div>
          </div>
          <ArrowRight size={16} color="var(--text-secondary)" aria-hidden="true" />
        </Link>

        <Link to="/admin/users" className="admin-quick-card">
          <div className="admin-quick-card__left">
            <Users size={20} color="var(--color-info)" aria-hidden="true" />
            <div>
              <div className="admin-quick-card__title">Quản lý Tài khoản</div>
              <div className="admin-quick-card__meta">{u?.total || 0} tài khoản</div>
            </div>
          </div>
          <ArrowRight size={16} color="var(--text-secondary)" aria-hidden="true" />
        </Link>

        <Link to="/admin/resources" className="admin-quick-card">
          <div className="admin-quick-card__left">
            <Sparkles size={20} color="var(--color-secondary)" aria-hidden="true" />
            <div>
              <div className="admin-quick-card__title">Tài nguyên Thư giãn</div>
              <div className="admin-quick-card__meta">{stats?.resources.total || 0} tài nguyên</div>
            </div>
          </div>
          <ArrowRight size={16} color="var(--text-secondary)" aria-hidden="true" />
        </Link>

        <Link to="/admin/audit-logs" className="admin-quick-card">
          <div className="admin-quick-card__left">
            <Activity size={20} color="var(--color-warning)" aria-hidden="true" />
            <div>
              <div className="admin-quick-card__title">Nhật ký Kiểm toán</div>
              <div className="admin-quick-card__meta">Audit logs & Hành vi</div>
            </div>
          </div>
          <ArrowRight size={16} color="var(--text-secondary)" aria-hidden="true" />
        </Link>
      </nav>
    </div>
  );
};
