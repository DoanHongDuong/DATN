import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, LayoutDashboard, Sparkles } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - var(--header-height, 65px) - 100px)',
        padding: '32px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '20px',
          boxShadow: 'var(--shadow-card)',
          padding: '48px 32px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        {/* Calming Compass Icon Pill */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'var(--tint-lavender)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '8px',
          }}
          aria-hidden="true"
        >
          <Compass size={36} strokeWidth={1.8} />
        </div>

        {/* Status Badge */}
        <span
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: '9999px',
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--color-primary)',
            letterSpacing: '0.04em',
          }}
        >
          404 • KHÔNG TÌM THẤY TRANG
        </span>

        {/* Heading */}
        <h1
          style={{
            margin: '4px 0 0 0',
            fontFamily: 'var(--heading)',
            fontSize: '26px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.3,
          }}
        >
          Lối nhỏ này chưa được khám phá
        </h1>

        {/* Compassionate Description */}
        <p
          style={{
            margin: '0 0 12px 0',
            fontSize: '14.5px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '440px',
          }}
        >
          Đường dẫn bạn đang tìm kiếm có thể đã được di chuyển hoặc chưa từng xuất hiện. Đừng lo lắng, hãy để chúng mình dẫn lối bạn quay về không gian quen thuộc nhé.
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            width: '100%',
            marginTop: '8px',
          }}
        >
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '11px 22px',
              borderRadius: '10px',
              background: 'var(--color-primary)',
              color: '#FFFFFF',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
              boxShadow: '0 2px 8px rgba(103, 80, 164, 0.2)',
              transition: 'all 0.2s ease',
            }}
          >
            <Home size={16} /> Quay lại Trang chủ
          </Link>

          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '11px 20px',
              borderRadius: '10px',
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-strong)',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'all 0.2s ease',
            }}
          >
            <LayoutDashboard size={16} /> Bảng điều khiển
          </Link>
        </div>

        {/* Gentle Alternative Link */}
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', width: '100%' }}>
          <Link
            to="/resources"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-secondary)',
              fontSize: '13.5px',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <Sparkles size={14} /> Bạn có muốn ghé qua góc thư giãn & thở sâu một chút?
          </Link>
        </div>
      </div>
    </div>
  );
};
