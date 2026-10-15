import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Users, UserCheck } from 'lucide-react';

export const AdminHeaderNav: React.FC = () => {
  const location = useLocation();

  const tabs = [
    {
      label: 'Hồ sơ tình nguyện viên chờ duyệt',
      path: '/admin/volunteers',
      icon: UserCheck,
    },
    {
      label: 'Quản lý người dùng',
      path: '/admin/users',
      icon: Users,
    },
  ];

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #aa3bff 0%, #6b21a8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}
        >
          <ShieldCheck size={20} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text-h)' }}>
            Trung tâm Quản trị Hệ thống
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)' }}>
            Quản lý phê duyệt tình nguyện viên và trạng thái tài khoản người dùng
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '8px',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'all 0.2s ease',
                background: isActive ? 'var(--accent-bg)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text)',
                border: isActive ? '1px solid var(--accent-border)' : '1px solid transparent',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
