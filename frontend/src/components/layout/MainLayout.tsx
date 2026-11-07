import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Navbar } from './Navbar';

export const MainLayout: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main style={{ flex: 1, padding: '24px', width: '100%', maxWidth: '1440px', margin: '0 auto', boxSizing: 'border-box' }}>
        <Outlet />
      </main>
      <footer style={{
        textAlign: 'center',
        padding: '20px',
        borderTop: '1px solid var(--border)',
        fontSize: '13px',
        color: 'var(--text)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <span>© {new Date().getFullYear()} MindCare - Hệ thống Hỗ trợ Sức khỏe Tâm thần Sinh viên.</span>
        <span>•</span>
        <Link to="/privacy" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
          Chính sách quyền riêng tư
        </Link>
      </footer>
    </div>
  );
};
