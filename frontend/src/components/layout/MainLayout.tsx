import React from 'react';
import { Outlet } from 'react-router-dom';
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
        color: 'var(--text)'
      }}>
        © {new Date().getFullYear()} MindCare - Hệ thống Hỗ trợ Sức khỏe Tâm thần Sinh viên.
      </footer>
    </div>
  );
};
