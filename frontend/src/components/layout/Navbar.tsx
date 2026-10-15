import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { HeartPulse, BookOpen, MessageSquare, LayoutDashboard, LogOut, User as UserIcon, ShieldCheck, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Tổng quan', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Đánh giá tâm lý', path: '/assessments', icon: HeartPulse },
    { label: 'Nhật ký cá nhân', path: '/journal', icon: BookOpen },
    { label: 'Thư giãn', path: '/resources', icon: Sparkles },
    { label: 'Tư vấn trực tiếp', path: '/chat', icon: MessageSquare },
    ...(user?.role === 'ADMIN'
      ? [{ label: 'Quản trị', path: '/admin', icon: ShieldCheck }]
      : []),
  ];

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <Link to="/" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        textDecoration: 'none',
        fontWeight: 700,
        fontSize: '20px',
        color: 'var(--text-h)'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #aa3bff 0%, #6b21a8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff'
        }}>
          💜
        </div>
        <span>MindCare</span>
      </Link>

      {isAuthenticated && (
        <nav style={{ display: 'flex', gap: '8px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                  background: isActive ? 'var(--accent-bg)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text)',
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isAuthenticated ? (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'var(--code-bg)',
              fontSize: '14px',
              color: 'var(--text-h)'
            }}>
              <UserIcon size={16} />
              <span>{user?.fullName}</span>
              <span style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '4px',
                background:
                  user?.role === 'ADMIN'
                    ? '#9333ea'
                    : user?.role === 'VOLUNTEER'
                      ? '#10b981'
                      : '#3b82f6',
                color: '#fff',
                fontWeight: 600
              }}>
                {user?.role === 'ADMIN' ? 'Admin' : user?.role === 'VOLUNTEER' ? 'TNV' : 'User'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              <LogOut size={16} />
              <span>Đăng xuất</span>
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'var(--text-h)',
                fontWeight: 500,
                fontSize: '14px'
              }}
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                textDecoration: 'none',
                background: 'var(--accent)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              Đăng ký
            </Link>
          </>
        )}
      </div>
    </header>
  );
};
