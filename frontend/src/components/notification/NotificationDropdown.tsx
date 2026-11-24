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
  Clock,
  Volume2,
} from 'lucide-react';
import { notificationApi, type NotificationItem } from '../../api/notification.api';
import {
  isBrowserNotificationSupported,
  requestBrowserNotificationPermission,
} from '../../utils/browserNotification';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');
  const [hasBrowserPerm, setHasBrowserPerm] = useState(() => {
    return isBrowserNotificationSupported() && Notification.permission === 'granted';
  });
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

  // Poll unread count every 45s & listen to socket events with debounce
  useEffect(() => {
    let cancelled = false;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

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

    // Lắng nghe thông báo socket realtime có debounce 600ms chống spam request
    const handleSocketNotification = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!cancelled) {
          checkCount();
          if (isOpen) {
            fetchNotifications();
          }
        }
      }, 600);
    };
    window.addEventListener('socket:new_notification', handleSocketNotification);

    return () => {
      cancelled = true;
      clearInterval(timer);
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('socket:new_notification', handleSocketNotification);
    };
  }, [isOpen, fetchNotifications]);

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

  const handleEnableBrowserNotification = async () => {
    const granted = await requestBrowserNotificationPermission();
    setHasBrowserPerm(granted);
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
    if (item.type.startsWith('SESSION_') || item.type === 'NEW_WAITING_SESSION') {
      navigate('/chat');
    } else if (item.type === 'VOLUNTEER_APPROVED') {
      navigate('/chat');
    } else if (item.type === 'VOLUNTEER_REJECTED') {
      navigate('/volunteer/apply');
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
        return <ShieldCheck size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />;
      case 'VOLUNTEER_REJECTED':
        return <UserX size={18} style={{ color: 'var(--color-crisis)', flexShrink: 0 }} />;
      case 'SESSION_ACCEPTED':
        return <MessageSquare size={18} style={{ color: 'var(--color-info)', flexShrink: 0 }} />;
      case 'NEW_WAITING_SESSION':
        return <Clock size={18} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />;
      case 'SESSION_ENDED':
        return <CheckCircle size={18} style={{ color: 'var(--color-secondary)', flexShrink: 0 }} />;
      case 'CRISIS_ALERT':
        return <AlertTriangle size={18} style={{ color: 'var(--color-crisis)', flexShrink: 0 }} />;
      default:
        return <Sparkles size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />;
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
          border: '1px solid var(--border-subtle)',
          background: isOpen ? 'var(--tint-lavender)' : 'transparent',
          color: isOpen ? 'var(--color-primary)' : 'var(--text-secondary)',
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
              background: 'var(--color-crisis)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 0 0 2px var(--bg-canvas)',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown-panel">
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-surface)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                Thông báo
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'var(--tint-lavender)',
                    color: 'var(--color-primary)',
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
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'background 0.2s ease',
                }}
              >
                <CheckCheck size={14} />
                <span>Đã đọc tất cả</span>
              </button>
            )}
          </div>

          {/* Subheader: Filter Tabs & Browser Alert Option */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-canvas)',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setFilterTab('all')}
                style={{
                  background: filterTab === 'all' ? 'var(--tint-lavender)' : 'transparent',
                  color: filterTab === 'all' ? 'var(--color-primary)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontWeight: filterTab === 'all' ? 600 : 500,
                  transition: 'all 0.15s ease',
                }}
              >
                Tất cả ({notifications.length})
              </button>
              <button
                onClick={() => setFilterTab('unread')}
                style={{
                  background: filterTab === 'unread' ? 'var(--tint-lavender)' : 'transparent',
                  color: filterTab === 'unread' ? 'var(--color-primary)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontWeight: filterTab === 'unread' ? 600 : 500,
                  transition: 'all 0.15s ease',
                }}
              >
                Chưa đọc ({unreadCount})
              </button>
            </div>

            {/* Browser notification quick permission button */}
            {isBrowserNotificationSupported() && !hasBrowserPerm && (
              <button
                onClick={handleEnableBrowserNotification}
                title="Bật thông báo ngoài màn hình"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  padding: '3px 6px',
                  borderRadius: '4px',
                }}
              >
                <Volume2 size={12} />
                <span>Bật pop-up</span>
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
              background: 'var(--bg-elevated)',
            }}
          >
            {isLoading ? (
              <div
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                }}
              >
                Đang tải thông báo...
              </div>
            ) : (filterTab === 'unread' ? notifications.filter((n) => !n.isRead) : notifications).length === 0 ? (
              <div
                style={{
                  padding: '44px 16px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Bell size={28} style={{ color: 'var(--text-disabled)' }} />
                <span style={{ fontSize: '13px' }}>
                  {filterTab === 'unread'
                    ? 'Bạn không có thông báo chưa đọc nào 🎉'
                    : 'Bạn chưa có thông báo nào'}
                </span>
              </div>
            ) : (
              (filterTab === 'unread' ? notifications.filter((n) => !n.isRead) : notifications).map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: item.isRead
                      ? 'transparent'
                      : 'var(--tint-lavender)',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
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
                          fontWeight: item.isRead ? 500 : 600,
                          color: 'var(--text-primary)',
                          lineHeight: '1.4',
                        }}
                      >
                        {item.title}
                      </h4>
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-disabled)',
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
                        color: 'var(--text-secondary)',
                        lineHeight: '1.45',
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
                        background: 'var(--color-primary)',
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
