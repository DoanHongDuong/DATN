import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  ShieldCheck,
  UserX,
  Sparkles,
} from 'lucide-react';
import { notificationApi, type NotificationItem } from '../../api/notification.api';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await notificationApi.getNotifications(1, 15);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Poll unread count every 45s
  useEffect(() => {
    let cancelled = false;

    const checkCount = () => {
      notificationApi
        .getUnreadCount()
        .then((data) => {
          if (!cancelled) {
            setUnreadCount(data.unreadCount);
          }
        })
        .catch(() => {
          // Ignore polling errors
        });
    };

    checkCount();
    const timer = setInterval(checkCount, 45000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await notificationApi.markAsRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification as read', err);
      }
    }

    setIsOpen(false);

    // Deep navigation based on notification type
    if (item.type.startsWith('SESSION_')) {
      navigate('/chat');
    } else if (item.type === 'VOLUNTEER_APPROVED') {
      navigate('/chat');
    } else if (item.type === 'CRISIS_ALERT') {
      navigate('/resources');
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return date.toLocaleDateString('vi-VN');
    } catch {
      return '';
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'VOLUNTEER_APPROVED':
        return <ShieldCheck size={18} style={{ color: '#10b981', flexShrink: 0 }} />;
      case 'VOLUNTEER_REJECTED':
        return <UserX size={18} style={{ color: '#ef4444', flexShrink: 0 }} />;
      case 'SESSION_ACCEPTED':
        return <MessageSquare size={18} style={{ color: '#3b82f6', flexShrink: 0 }} />;
      case 'SESSION_ENDED':
        return <CheckCircle size={18} style={{ color: '#8b5cf6', flexShrink: 0 }} />;
      case 'CRISIS_ALERT':
        return <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />;
      default:
        return <Sparkles size={18} style={{ color: '#a855f7', flexShrink: 0 }} />;
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={handleToggle}
        aria-label="Thông báo"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          border: '1px solid var(--border)',
          background: isOpen ? 'var(--accent-bg, #f3e8ff)' : 'transparent',
          color: isOpen ? 'var(--accent, #9333ea)' : 'var(--text)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              minWidth: '18px',
              height: '18px',
              borderRadius: '9px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 0 0 2px var(--bg)',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="notification-dropdown-panel"
          style={{
            position: 'absolute',
            top: '46px',
            right: 0,
            width: '360px',
            maxWidth: 'calc(100vw - 24px)',
            maxHeight: '480px',
            background: 'var(--card-bg, #1e1e2d)',
            borderRadius: '14px',
            border: '1px solid var(--border)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--code-bg, rgba(255, 255, 255, 0.03))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-h)' }}>
                Thông báo
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'var(--accent-bg, rgba(168, 85, 247, 0.15))',
                    color: 'var(--accent, #a855f7)',
                  }}
                >
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                title="Đánh dấu tất cả đã đọc"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent, #a855f7)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  padding: '4px 6px',
                  borderRadius: '6px',
                }}
              >
                <CheckCheck size={14} />
                <span>Đã đọc tất cả</span>
              </button>
            )}
          </div>

          {/* Body */}
          <div
            style={{
              overflowY: 'auto',
              maxHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {isLoading ? (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: 'var(--text)',
                  fontSize: '13px',
                }}
              >
                Đang tải thông báo...
              </div>
            ) : notifications.length === 0 ? (
              <div
                style={{
                  padding: '40px 16px',
                  textAlign: 'center',
                  color: 'var(--text)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Bell size={28} style={{ opacity: 0.3 }} />
                <span style={{ fontSize: '13px', opacity: 0.7 }}>
                  Bạn chưa có thông báo nào
                </span>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    background: item.isRead
                      ? 'transparent'
                      : 'var(--accent-bg, rgba(168, 85, 247, 0.08))',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div style={{ marginTop: '2px' }}>{renderIcon(item.type)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'space-between',
                        gap: '8px',
                        marginBottom: '3px',
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '13px',
                          fontWeight: item.isRead ? 600 : 700,
                          color: 'var(--text-h)',
                          lineHeight: '1.4',
                        }}
                      >
                        {item.title}
                      </h4>
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--text)',
                          opacity: 0.6,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {formatTime(item.createdAt)}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '12px',
                        color: 'var(--text)',
                        lineHeight: '1.4',
                        opacity: item.isRead ? 0.75 : 0.95,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.content}
                    </p>
                  </div>
                  {!item.isRead && (
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--accent, #a855f7)',
                        marginTop: '6px',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
