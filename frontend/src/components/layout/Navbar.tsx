import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Drawer } from 'antd';
import { useAuth } from '../../hooks/useAuth';
import {
  HeartPulse,
  BookOpen,
  MessageSquare,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Sparkles,
  Menu,
} from 'lucide-react';
import { NotificationDropdown } from '../notification/NotificationDropdown';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(location.pathname);

  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setMobileMenuOpen(false);
  }

  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password'].includes(
    location.pathname,
  );

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = user?.role === 'ADMIN'
    ? [
        { label: 'Cổng Quản trị', path: '/admin', icon: ShieldCheck },
        { label: 'Đánh giá tâm lý', path: '/assessments', icon: HeartPulse },
        { label: 'Thư giãn', path: '/resources', icon: Sparkles },
      ]
    : [
        { label: user?.role === 'VOLUNTEER' ? 'Bàn trực TNV' : 'Tổng quan', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Đánh giá tâm lý', path: '/assessments', icon: HeartPulse },
        { label: 'Nhật ký cá nhân', path: '/journal', icon: BookOpen },
        { label: 'Thư giãn', path: '/resources', icon: Sparkles },
        { label: user?.role === 'VOLUNTEER' ? 'Phòng tư vấn' : 'Tư vấn trực tiếp', path: '/chat', icon: MessageSquare },
      ];

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return { background: 'var(--color-primary)', color: '#FFFFFF' };
      case 'VOLUNTEER':
        return { background: 'var(--color-secondary)', color: '#FFFFFF' };
      default:
        return { background: 'var(--color-info)', color: '#FFFFFF' };
    }
  };

  return (
    <header className="app-header">
      {/* Brand Logo & Name */}
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: '18px',
          color: 'var(--text-primary)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform 0.2s ease',
          }}
        >
          <HeartPulse size={19} />
        </div>
        <span style={{ letterSpacing: '-0.015em' }}>PSYTHALIA</span>
      </Link>

      {/* Desktop Capsule Navigation */}
      {!isAuthPage && isAuthenticated && (
        <nav className="desktop-nav capsule-nav-container">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`capsule-nav-item ${isActive ? 'capsule-nav-item--active' : ''}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {isActive && (
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: 'currentColor',
                      marginLeft: '2px',
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Right Controls: Notifications, User Profile & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {isAuthPage ? (
          location.pathname === '/login' ? (
            <Link
              to="/register"
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                textDecoration: 'none',
                background: 'var(--color-primary)',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '13.5px',
                boxShadow: 'var(--shadow-sm)',
                transition: 'opacity 0.2s ease',
              }}
            >
              Đăng ký
            </Link>
          ) : (
            <Link
              to="/login"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                fontWeight: 500,
                fontSize: '13.5px',
              }}
            >
              Đăng nhập
            </Link>
          )
        ) : isAuthenticated ? (
          <>
            <NotificationDropdown />
            <Link
              to="/profile"
              title="Hồ sơ cá nhân & Đổi mật khẩu"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px 4px 6px',
                borderRadius: '24px',
                background: location.pathname === '/profile' ? 'var(--tint-lavender)' : 'var(--bg-surface)',
                border: location.pathname === '/profile' ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
                fontSize: '13px',
                color: location.pathname === '/profile' ? 'var(--color-primary)' : 'var(--text-primary)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'var(--tint-lavender)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)',
                }}
              >
                <UserIcon size={14} />
              </div>
              <span className="user-name-text" style={{ fontWeight: 500 }}>
                {user?.fullName}
              </span>
              <span
                style={{
                  fontSize: '10.5px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  ...getRoleBadgeStyle(user?.role),
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}
              >
                {user?.role === 'ADMIN' ? 'Admin' : user?.role === 'VOLUNTEER' ? 'TNV' : 'Người dùng'}
              </span>
            </Link>

            {/* Desktop-only Logout Button */}
            <button
              onClick={handleLogout}
              className="desktop-logout-btn"
              title="Đăng xuất khỏi hệ thống"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
            >
              <LogOut size={15} />
              <span className="user-name-text">Đăng xuất</span>
            </button>

            {/* Mobile Hamburger Button */}
            {!isAuthPage && (
              <button
                className="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Mở menu danh mục"
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  padding: 0,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Menu size={20} />
              </button>
            )}
          </>
        ) : (
          <>
            <Link
              to="/login"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: 'var(--text-primary)',
                fontWeight: 500,
                fontSize: '13.5px',
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
                background: 'var(--color-primary)',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '13.5px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              Đăng ký
            </Link>
          </>
        )}
      </div>

      {/* Modern Accessible Mobile Drawer Navigation */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <HeartPulse size={16} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>
              PSYTHALIA
            </span>
          </div>
        }
        placement="right"
        width={300}
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        styles={{
          body: {
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'var(--bg-elevated)',
          },
          header: {
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-subtle)',
          },
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* User Info Header in Mobile Drawer */}
          {isAuthenticated && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--tint-lavender)',
                marginBottom: '12px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                }}
              >
                <UserIcon size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                  {user?.fullName}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {user?.role === 'ADMIN'
                    ? 'Quản trị viên'
                    : user?.role === 'VOLUNTEER'
                      ? 'Tình nguyện viên PFA'
                      : 'Người dùng'}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links with large touch targets */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontSize: '14.5px',
                  fontWeight: isActive ? 600 : 500,
                  minHeight: '44px',
                  transition: 'background-color 0.15s ease',
                  background: isActive ? 'var(--tint-lavender)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--text-primary)',
                  border: isActive ? '1px solid rgba(103, 80, 164, 0.25)' : '1px solid transparent',
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <Link
            to="/profile"
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '12px 16px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14.5px',
              fontWeight: location.pathname === '/profile' ? 600 : 500,
              minHeight: '44px',
              background: location.pathname === '/profile' ? 'var(--tint-lavender)' : 'transparent',
              color: location.pathname === '/profile' ? 'var(--color-primary)' : 'var(--text-primary)',
            }}
          >
            <UserIcon size={19} />
            <span>Hồ sơ cá nhân & Đổi mật khẩu</span>
          </Link>
        </div>

        {/* Mobile Logout Button at Bottom */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '16px' }}>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: 'var(--tint-crimson)',
              color: 'var(--color-crisis)',
              cursor: 'pointer',
              fontSize: '14.5px',
              fontWeight: 600,
              minHeight: '44px',
              transition: 'opacity 0.2s ease',
            }}
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </Drawer>
    </header>
  );
};
