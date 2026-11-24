import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Users, UserCheck, Sparkles, ClipboardList, BarChart3 } from 'lucide-react';
import './admin.css';

export const AdminHeaderNav: React.FC = () => {
  const location = useLocation();

  const tabs = [
    {
      label: 'Tổng quan & Thống kê',
      path: '/admin/stats',
      icon: BarChart3,
    },
    {
      label: 'Hồ sơ TNV chờ duyệt',
      path: '/admin/volunteers',
      icon: UserCheck,
    },
    {
      label: 'Quản lý tài khoản & TNV',
      path: '/admin/users',
      icon: Users,
    },
    {
      label: 'Tài nguyên thư giãn',
      path: '/admin/resources',
      icon: Sparkles,
    },
    {
      label: 'Nhật ký kiểm toán',
      path: '/admin/audit-logs',
      icon: ClipboardList,
    },
  ];

  return (
    <header className="admin-header-wrapper">
      <div className="admin-header-brand">
        <div className="admin-header-icon" aria-hidden="true">
          <ShieldCheck size={22} />
        </div>
        <div>
          <h1 className="admin-header-title">Trung tâm Quản trị Hệ thống</h1>
          <p className="admin-header-subtitle">
            Giám sát vận hành, phê duyệt tình nguyện viên và quản lý tài khoản người dùng
          </p>
        </div>
      </div>

      <nav className="admin-nav-tabs" aria-label="Điều hướng phân hệ quản trị">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              aria-current={isActive ? 'page' : undefined}
              className={`admin-nav-tab ${isActive ? 'admin-nav-tab--active' : ''}`}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
};
