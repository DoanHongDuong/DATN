import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Navbar } from './Navbar';
import { EmailVerificationBanner } from '../common/EmailVerificationBanner';

export const MainLayout: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100svh',
        background: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
        transition: 'background-color 0.3s ease',
      }}
    >
      <Navbar />
      <EmailVerificationBanner />
      <main className="app-main-content">
        <Outlet />
      </main>
      <footer
        style={{
          textAlign: 'center',
          padding: '24px 20px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-canvas)',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          transition: 'all 0.3s ease',
        }}
      >
        <span>© {new Date().getFullYear()} PSYTHALIA — Nền tảng Hỗ trợ Sức khỏe Tinh thần & Sơ cứu Tâm lý.</span>
        <span>•</span>
        <Link
          to="/privacy"
          style={{
            color: 'var(--color-primary)',
            textDecoration: 'none',
            fontWeight: 500,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Chính sách quyền riêng tư
        </Link>
      </footer>
    </div>
  );
};
