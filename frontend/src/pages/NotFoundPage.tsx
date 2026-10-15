import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <h1 style={{ fontSize: '72px', margin: '0 0 16px 0', color: 'var(--accent)' }}>404</h1>
      <h2 style={{ margin: '0 0 12px 0', color: 'var(--text-h)' }}>Trang không tồn tại</h2>
      <p style={{ color: 'var(--text)', fontSize: '15px', marginBottom: '28px' }}>
        Đường dẫn bạn truy cập không tồn tại hoặc đã được di chuyển.
      </p>
      <Link to="/" style={{ padding: '12px 24px', borderRadius: '8px', background: 'var(--accent)', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
        Quay lại Trang chủ
      </Link>
    </div>
  );
};
