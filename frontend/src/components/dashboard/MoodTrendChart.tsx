import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Calendar,
  PlusCircle,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import {
  journalApi,
  type MoodTrendPoint,
  type MoodTrendResponse,
} from '../../api/journal.api';

interface MoodTrendChartProps {
  className?: string;
}

export const MoodTrendChart: React.FC<MoodTrendChartProps> = ({ className }) => {
  const [days, setDays] = useState<number>(14);
  const [data, setData] = useState<MoodTrendResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<MoodTrendPoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const fetchTrend = useCallback(async (selectedDays: number) => {
    setLoading(true);
    try {
      const res = await journalApi.getMoodTrend(selectedDays);
      setData(res);
    } catch (err) {
      console.error('Failed to fetch mood trend:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    journalApi
      .getMoodTrend(days)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Failed to fetch mood trend:', err);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [days]);

  // SVG Chart Dimensions
  const svgWidth = 760;
  const svgHeight = 220;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };
  const innerWidth = svgWidth - padding.left - padding.right;
  const innerHeight = svgHeight - padding.top - padding.bottom;

  const points = data?.points || [];
  const summary = data?.summary;

  // Coordinate mapping: Score from -1.0 to 1.0 -> SVG Y
  const getY = (score: number) => {
    // 1.0 -> top (padding.top), -1.0 -> bottom (padding.top + innerHeight), 0.0 -> center
    const normalized = (score + 1) / 2; // 0 to 1
    return padding.top + innerHeight - normalized * innerHeight;
  };

  const getX = (index: number, total: number) => {
    if (total <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (total - 1)) * innerWidth;
  };

  // Build SVG Path
  const buildLinePath = () => {
    if (points.length === 0) return '';
    return points
      .map((p, i) => {
        const x = getX(i, points.length);
        const y = getY(p.avgScore);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const buildAreaPath = () => {
    if (points.length === 0) return '';
    const linePath = buildLinePath();
    const lastX = getX(points.length - 1, points.length);
    const firstX = getX(0, points.length);
    const bottomY = padding.top + innerHeight;
    return `${linePath} L ${lastX.toFixed(1)} ${bottomY} L ${firstX.toFixed(1)} ${bottomY} Z`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.25) return '#10b981'; // Green
    if (score <= -0.25) return '#ef4444'; // Red
    return '#8b5cf6'; // Purple / Neutral
  };

  const getSentimentText = (label: string) => {
    switch (label.toLowerCase()) {
      case 'positive':
        return 'Tích cực';
      case 'negative':
        return 'Tiêu cực';
      case 'crisis':
        return 'Khủng hoảng';
      default:
        return 'Cân bằng';
    }
  };

  const getTrendBadge = () => {
    // Quy tắc an toàn & tin cậy: Có crisis thì ưu tiên trạng thái hỗ trợ cao nhất, không hiển thị tích cực/ổn định
    if (summary?.trend === 'crisis' || (summary && summary.crisisCount > 0)) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#ef4444', fontWeight: 600 }}>
          <AlertTriangle size={16} /> Cần hỗ trợ ưu tiên (Phát hiện dấu hiệu khủng hoảng)
        </span>
      );
    }
    if (!summary || summary.trend === 'insufficient_data') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--text)' }}>
          <Minus size={15} /> Chưa đủ dữ liệu để nhận xét xu hướng
        </span>
      );
    }
    if (summary.trend === 'improving') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
          <TrendingUp size={16} /> Xu hướng tích cực (Đang cải thiện)
        </span>
      );
    }
    if (summary.trend === 'declining') {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#f59e0b', fontWeight: 600 }}>
          <TrendingDown size={16} /> Cần quan tâm (Có xu hướng đi xuống)
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#8b5cf6', fontWeight: 600 }}>
        <Activity size={16} /> Tương đối ổn định
      </span>
    );
  };

  return (
    <div
      className={className}
      style={{
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        position: 'relative',
      }}
    >
      {/* Header & Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(170, 59, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
            }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--text-h)' }}>
                Biểu đồ Xu hướng Cảm xúc
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)' }}>
                Theo dõi biến thiên tâm trạng & chỉ số cảm xúc qua nhật ký AI
              </p>
            </div>
          </div>
        </div>

        {/* Days Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--code-bg)', padding: '4px', borderRadius: '8px' }}>
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => {
                setDays(d);
                fetchTrend(d);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: days === d ? 'var(--accent)' : 'transparent',
                color: days === d ? '#fff' : 'var(--text)',
                fontSize: '13px',
                fontWeight: days === d ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {d} ngày
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && summary.totalEntries > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          padding: '16px',
          borderRadius: '12px',
          background: 'var(--code-bg)',
          border: '1px solid var(--border)',
        }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '4px' }}>
              Điểm cảm xúc TB
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: getScoreColor(summary.avgScore) }}>
              {summary.avgScore > 0 ? `+${summary.avgScore}` : summary.avgScore}
              <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text)', marginLeft: '6px' }}>
                (-1.0 đến +1.0)
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '4px' }}>
              Tổng bài ghi nhật ký
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-h)' }}>
              {summary.totalEntries} <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text)' }}>bài</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '4px' }}>
              Phân bổ cảm xúc
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <span style={{ color: '#10b981', fontWeight: 600 }}>😊 {summary.positiveCount}</span>
              <span style={{ color: '#8b5cf6', fontWeight: 600 }}>😐 {summary.neutralCount}</span>
              <span style={{ color: '#ef4444', fontWeight: 600 }}>😔 {summary.negativeCount + summary.crisisCount}</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '4px' }}>
              Đánh giá xu hướng
            </div>
            <div>{getTrendBadge()}</div>
          </div>
        </div>
      )}

      {/* Cảnh báo ưu tiên hỗ trợ khi có crisis trong khoảng thời gian đang xem */}
      {summary && (summary.trend === 'crisis' || summary.crisisCount > 0) && (
        <div style={{
          padding: '16px 20px',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', maxWidth: '600px' }}>
            <AlertTriangle size={22} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
                Hệ thống ghi nhận dấu hiệu khủng hoảng cảm xúc
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text)', lineHeight: '1.4' }}>
                Trong khoảng thời gian này ghi nhận cảm xúc bất ổn hoặc căng thẳng cao. Bạn không phải vượt qua điều này một mình, hãy kết nối với Tình nguyện viên hoặc liên hệ đường dây nóng hỗ trợ.
              </p>
            </div>
          </div>
          <Link
            to="/chat"
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: '#ef4444',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Kết nối tư vấn
          </Link>
        </div>
      )}

      {/* Main Chart Canvas Area */}
      {loading ? (
        <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', fontSize: '14px' }}>
          Đang tải dữ liệu biểu đồ...
        </div>
      ) : points.length === 0 ? (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          borderRadius: '12px',
          background: 'var(--code-bg)',
          border: '1px dashed var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
        }}>
          <Sparkles size={32} color="var(--accent)" />
          <div style={{ color: 'var(--text-h)', fontWeight: 600, fontSize: '15px' }}>
            Chưa có dữ liệu cảm xúc trong {days} ngày qua
          </div>
          <p style={{ color: 'var(--text)', fontSize: '13px', margin: 0, maxWidth: '420px' }}>
            Ghi chép nhật ký hàng ngày để AI nhận diện tâm trạng và trực quan hóa biểu đồ xu hướng cảm xúc của bạn.
          </p>
          <Link
            to="/journal"
            style={{
              marginTop: '4px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'var(--accent)',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <PlusCircle size={16} /> Viết nhật ký ngay
          </Link>
        </div>
      ) : (
        <div style={{ position: 'relative', overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', height: 'auto', minWidth: '550px', display: 'block' }}
          >
            <defs>
              <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Background Grid Lines & Y-Axis Labels */}
            {/* Top: +1.0 (Tích cực) */}
            <line
              x1={padding.left}
              y1={padding.top}
              x2={svgWidth - padding.right}
              y2={padding.top}
              stroke="var(--border)"
              strokeDasharray="4 4"
              strokeOpacity="0.5"
            />
            <text
              x={padding.left - 10}
              y={padding.top + 4}
              textAnchor="end"
              fontSize="11"
              fill="#10b981"
              fontWeight="600"
            >
              +1.0 😊
            </text>

            {/* Mid: 0.0 (Cân bằng) */}
            <line
              x1={padding.left}
              y1={padding.top + innerHeight / 2}
              x2={svgWidth - padding.right}
              y2={padding.top + innerHeight / 2}
              stroke="var(--border)"
              strokeDasharray="3 3"
              strokeOpacity="0.7"
            />
            <text
              x={padding.left - 10}
              y={padding.top + innerHeight / 2 + 4}
              textAnchor="end"
              fontSize="11"
              fill="var(--text)"
            >
              0.0 😐
            </text>

            {/* Bottom: -1.0 (Tiêu cực) */}
            <line
              x1={padding.left}
              y1={padding.top + innerHeight}
              x2={svgWidth - padding.right}
              y2={padding.top + innerHeight}
              stroke="var(--border)"
              strokeDasharray="4 4"
              strokeOpacity="0.5"
            />
            <text
              x={padding.left - 10}
              y={padding.top + innerHeight + 4}
              textAnchor="end"
              fontSize="11"
              fill="#ef4444"
              fontWeight="600"
            >
              -1.0 😔
            </text>

            {/* Area Fill */}
            {points.length > 1 && (
              <path d={buildAreaPath()} fill="url(#moodGradient)" />
            )}

            {/* Line Curve */}
            {points.length > 1 && (
              <path
                d={buildLinePath()}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Individual Data Points */}
            {points.map((p, idx) => {
              const x = getX(idx, points.length);
              const y = getY(p.avgScore);
              const pointColor = getScoreColor(p.avgScore);
              const isHovered = hoveredPoint?.date === p.date;

              // Format date label (e.g., 28/10)
              const [yStr, mStr, dStr] = p.date.split('-');
              const shortDate = yStr && mStr && dStr ? `${dStr}/${mStr}` : p.date;

              return (
                <g key={p.date}>
                  {/* Vertical guideline */}
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={padding.top + innerHeight}
                    stroke="var(--border)"
                    strokeOpacity={isHovered ? '0.6' : '0.15'}
                    strokeDasharray="2 2"
                  />

                  {/* Date label at bottom */}
                  <text
                    x={x}
                    y={padding.top + innerHeight + 20}
                    textAnchor="middle"
                    fontSize="11"
                    fill={isHovered ? 'var(--text-h)' : 'var(--text)'}
                    fontWeight={isHovered ? '600' : '400'}
                  >
                    {shortDate}
                  </text>

                  {/* Outer glow ring when hovered */}
                  {isHovered && (
                    <circle
                      cx={x}
                      cy={y}
                      r="10"
                      fill={pointColor}
                      fillOpacity="0.25"
                    />
                  )}

                  {/* Main Data Dot */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? '6' : '4.5'}
                    fill={pointColor}
                    stroke="var(--bg)"
                    strokeWidth="2"
                    style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredPoint(p);
                      setHoverPos({ x: rect.left + window.scrollX, y: rect.top + window.scrollY });
                    }}
                    onMouseLeave={() => {
                      setHoveredPoint(null);
                      setHoverPos(null);
                    }}
                  />

                  {/* Mood Emoji above dot if available */}
                  {p.moodEmojis.length > 0 && (
                    <text
                      x={x}
                      y={y - 10}
                      textAnchor="middle"
                      fontSize="13"
                      style={{ pointerEvents: 'none' }}
                    >
                      {p.moodEmojis[0]}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Interactive Floating Tooltip */}
          {hoveredPoint && hoverPos && (
            <div
              style={{
                position: 'fixed',
                top: hoverPos.y - 105,
                left: hoverPos.x - 70,
                zIndex: 1000,
                background: '#1f1b2e',
                border: '1px solid var(--accent)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#fff',
                fontSize: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                pointerEvents: 'none',
                minWidth: '140px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, marginBottom: '4px' }}>
                <Calendar size={13} color="var(--accent)" />
                {new Date(hoveredPoint.date).toLocaleDateString('vi-VN')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ color: 'var(--text)' }}>Cảm xúc:</span>
                <span style={{ fontWeight: 600, color: getScoreColor(hoveredPoint.avgScore) }}>
                  {hoveredPoint.moodEmojis.join(' ')} {getSentimentText(hoveredPoint.dominantSentiment)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text)' }}>Điểm số:</span>
                <span style={{ fontWeight: 600 }}>
                  {hoveredPoint.avgScore > 0 ? `+${hoveredPoint.avgScore}` : hoveredPoint.avgScore}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text)', marginTop: '4px' }}>
                {hoveredPoint.entryCount} bài nhật ký
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

