import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Table, Button, Tag, Card, Alert, Space, message, Typography, Switch, Popconfirm, Modal, Rate, Input } from 'antd';
import {
  MessageSquare,
  Clock,
  UserCheck,
  Send,
  PhoneCall,
  RefreshCw,
  LogOut,
  Star,
  Heart,
} from 'lucide-react';
import axios, { AxiosError } from 'axios';
import {
  chatApi,
  type ChatSession,
  type ChatMessage,
  type PriorityLevel,
} from '../api/chat.api';
import { volunteerApi } from '../api/volunteer.api';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const { Text, Title } = Typography;

const PRIORITY_COLOR_MAP: Record<PriorityLevel, string> = {
  CRITICAL: 'error',
  HIGH: 'warning',
  MEDIUM: 'processing',
  LOW: 'success',
};

const PRIORITY_LABEL_MAP: Record<PriorityLevel, string> = {
  CRITICAL: 'Rất cao (Critical)',
  HIGH: 'Cao (High)',
  MEDIUM: 'Trung bình (Medium)',
  LOW: 'Thấp (Low)',
};

const RATING_DESC = [
  'Rất không hài lòng',
  'Chưa hài lòng',
  'Bình thường',
  'Hài lòng',
  'Rất hài lòng',
];

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const isVolunteer = user?.role === 'VOLUNTEER';

  // State chung
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');

  // State cho Volunteer (hàng đợi & trạng thái online)
  const [waitingSessions, setWaitingSessions] = useState<ChatSession[]>([]);
  const [loadingQueue, setLoadingQueue] = useState<boolean>(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [togglingOnline, setTogglingOnline] = useState<boolean>(false);

  // Lấy trạng thái online ban đầu của tình nguyện viên
  useEffect(() => {
    if (isVolunteer) {
      volunteerApi.getMyProfile().then((p) => {
        if (p) {
          setIsOnline(p.isOnline);
        }
      }).catch((err) => {
        console.error('Failed to get volunteer online status', err);
      });
    }
  }, [isVolunteer]);

  const handleToggleOnline = async (checked: boolean) => {
    setTogglingOnline(true);
    try {
      const updated = await volunteerApi.updateOnlineStatus(checked);
      setIsOnline(updated.isOnline);
      message.success(
        updated.isOnline
          ? 'Đã bật trạng thái sẵn sàng nhận phiên hỗ trợ'
          : 'Đã tắt trạng thái sẵn sàng nhận phiên',
      );
    } catch (err: unknown) {
      let msg = 'Không thể thay đổi trạng thái trực tuyến';
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        msg = axiosErr.response?.data?.message || msg;
      }
      message.error(msg);
    } finally {
      setTogglingOnline(false);
    }
  };

  // State cho User (yêu cầu hỗ trợ)
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [isRequesting, setIsRequesting] = useState<boolean>(false);
  const [cancellingSession, setCancellingSession] = useState<boolean>(false);
  const [noVolunteerInfo, setNoVolunteerInfo] = useState<{
    noVolunteer: boolean;
    hotline?: string;
  }>({ noVolunteer: false });

  // State cho Đánh giá phiên hỗ trợ (PB-27)
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  const [feedbackSessionId, setFeedbackSessionId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submittingFeedback, setSubmittingFeedback] = useState<boolean>(false);
  const activeSessionRef = useRef<ChatSession | null>(null);

  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  // Tải danh sách tin nhắn của session
  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      const history = await chatApi.getMessages(sessionId);
      setMessages(history || []);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  }, []);

  // Lấy vị trí trong hàng đợi (cho User)
  const fetchQueuePosition = useCallback(async (sessionId: string) => {
    try {
      const pos = await chatApi.getQueuePosition(sessionId);
      setQueuePosition(pos.position);
    } catch (err) {
      console.error('Failed to get queue position:', err);
    }
  }, []);

  // Khôi phục phiên chat hiện tại nếu user hoặc TNV đang có phiên WAITING hoặc ACTIVE
  useEffect(() => {
    let isMounted = true;
    const fetchCurrentSession = async () => {
      try {
        const session = await chatApi.getMyActiveSession();
        if (isMounted && session) {
          setActiveSession(session);
          if (session.status === 'WAITING') {
            fetchQueuePosition(session.id);
          } else if (session.status === 'ACTIVE') {
            loadMessages(session.id);
            if (socket) {
              socket.emit('join_session', { sessionId: session.id });
            }
          }
        }
      } catch (err) {
        console.error('Failed to restore active session:', err);
      }
    };

    fetchCurrentSession();
    return () => {
      isMounted = false;
    };
  }, [fetchQueuePosition, loadMessages, socket]);

  // Xử lý User: Huỷ yêu cầu hỗ trợ khi đang trong hàng đợi
  const handleCancelSession = async () => {
    if (!activeSession) return;
    setCancellingSession(true);
    try {
      await chatApi.cancelSession(activeSession.id);
      setActiveSession(null);
      setQueuePosition(null);
      message.success('Đã huỷ yêu cầu tư vấn thành công.');
    } catch (err: unknown) {
      let msg = 'Không thể huỷ yêu cầu hỗ trợ.';
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        msg = axiosErr.response?.data?.message || msg;
      }
      message.error(msg);
    } finally {
      setCancellingSession(false);
    }
  };

  // Lấy danh sách hàng đợi (cho Volunteer)
  const fetchWaitingSessions = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const list = await chatApi.getWaitingSessions();
      setWaitingSessions(list || []);
    } catch (err) {
      console.error('Failed to fetch waiting sessions:', err);
      message.error('Không thể tải danh sách hàng đợi.');
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  // Tự động load danh sách hàng đợi khi Volunteer vào trang
  useEffect(() => {
    let isMounted = true;
    if (isVolunteer && !activeSession) {
      const loadQueue = async () => {
        try {
          const list = await chatApi.getWaitingSessions();
          if (isMounted) {
            setWaitingSessions(list || []);
          }
        } catch (err) {
          console.error('Failed to fetch waiting sessions:', err);
        } finally {
          if (isMounted) {
            setLoadingQueue(false);
          }
        }
      };
      loadQueue();
    }
    return () => {
      isMounted = false;
    };
  }, [isVolunteer, activeSession]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Khi user nhận được thông báo TNV đã accept
    const onSessionAccepted = (session: ChatSession) => {
      setActiveSession(session);
      setQueuePosition(null);
      loadMessages(session.id);
      socket.emit('join_session', { sessionId: session.id });
      message.success('Tình nguyện viên đã tham gia cuộc trò chuyện!');
    };

    // Khi có tin nhắn mới trong phòng chat
    const onNewMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    // Khi phiên chat kết thúc
    const onSessionEnded = (closedSession?: ChatSession) => {
      const endedSessionId = closedSession?.id || activeSessionRef.current?.id;
      setActiveSession(null);
      setMessages([]);
      message.info('Phiên tư vấn hỗ trợ đã kết thúc.');
      if (isVolunteer) {
        fetchWaitingSessions();
      } else if (endedSessionId) {
        setFeedbackSessionId(endedSessionId);
        setIsFeedbackModalOpen(true);
      }
    };

    socket.on('session_accepted', onSessionAccepted);
    socket.on('new_message', onNewMessage);
    socket.on('session_ended', onSessionEnded);

    return () => {
      socket.off('session_accepted', onSessionAccepted);
      socket.off('new_message', onNewMessage);
      socket.off('session_ended', onSessionEnded);
    };
  }, [socket, loadMessages, isVolunteer, fetchWaitingSessions]);

  // Join room socket khi activeSession thay đổi
  useEffect(() => {
    if (socket && activeSession && activeSession.status === 'ACTIVE') {
      socket.emit('join_session', { sessionId: activeSession.id });
    }
  }, [socket, activeSession]);

  // Xử lý Volunteer: Nhận phiên
  const handleAcceptSession = async (sessionId: string) => {
    setAcceptingId(sessionId);
    try {
      const session = await chatApi.acceptSession(sessionId);
      setActiveSession(session);
      loadMessages(session.id);
      if (socket) {
        socket.emit('join_session', { sessionId: session.id });
      }
      message.success('Nhận phiên hỗ trợ thành công!');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        if (axiosErr.response?.status === 409) {
          message.warning('Phiên này đã được nhận bởi tình nguyện viên khác!');
          fetchWaitingSessions();
          return;
        }
        message.error(axiosErr.response?.data?.message || 'Không thể nhận phiên.');
      } else {
        message.error('Có lỗi xảy ra khi nhận phiên.');
      }
      fetchWaitingSessions();
    } finally {
      setAcceptingId(null);
    }
  };

  // Xử lý Volunteer: Kết thúc phiên
  const handleEndSession = () => {
    if (!activeSession || !socket) return;
    if (!confirm('Bạn có chắc chắn muốn kết thúc phiên tư vấn này?')) return;

    socket.emit('end_session', { sessionId: activeSession.id });
    setActiveSession(null);
    setMessages([]);
    message.success('Đã kết thúc phiên hỗ trợ.');
    fetchWaitingSessions();
  };

  // Xử lý User: Gửi yêu cầu hỗ trợ
  const handleRequestSupport = async () => {
    setIsRequesting(true);
    setNoVolunteerInfo({ noVolunteer: false });
    try {
      const response = await chatApi.requestSupport();

      if (response.noVolunteerAvailable) {
        setNoVolunteerInfo({
          noVolunteer: true,
          hotline: response.hotline || import.meta.env.VITE_EMERGENCY_HOTLINE || '1900 6789',
        });
        return;
      }

      if (response.session) {
        setActiveSession(response.session);
        if (response.session.status === 'WAITING') {
          fetchQueuePosition(response.session.id);
        } else if (response.session.status === 'ACTIVE') {
          loadMessages(response.session.id);
          if (socket) {
            socket.emit('join_session', { sessionId: response.session.id });
          }
        }
      }
    } catch (err: unknown) {
      let msg = 'Không thể gửi yêu cầu hỗ trợ.';
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        msg = axiosErr.response?.data?.message || msg;

        // Nếu đã có phiên chưa kết thúc (409 Conflict), tự động khôi phục phiên đó
        if (axiosErr.response?.status === 409) {
          try {
            const currentSession = await chatApi.getMyActiveSession();
            if (currentSession) {
              setActiveSession(currentSession);
              if (currentSession.status === 'WAITING') {
                fetchQueuePosition(currentSession.id);
              } else if (currentSession.status === 'ACTIVE') {
                loadMessages(currentSession.id);
                if (socket) {
                  socket.emit('join_session', { sessionId: currentSession.id });
                }
              }
              message.info('Đã khôi phục phiên hỗ trợ hiện tại của bạn.');
              return;
            }
          } catch (restoreErr) {
            console.error('Failed to auto-restore session:', restoreErr);
          }
        }
      }
      message.error(msg);
    } finally {
      setIsRequesting(false);
    }
  };

  // Xử lý gửi tin nhắn
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeSession || !socket) return;

    socket.emit('send_message', {
      sessionId: activeSession.id,
      content: inputMessage.trim(),
    });

    setInputMessage('');
  };

  // Xử lý gửi đánh giá chất lượng phiên (PB-27)
  const handleSubmitFeedback = async () => {
    if (!feedbackSessionId) return;
    if (rating < 1) {
      message.warning('Vui lòng chọn số sao đánh giá (từ 1 đến 5 sao)');
      return;
    }

    setSubmittingFeedback(true);
    try {
      await chatApi.submitFeedback(feedbackSessionId, {
        rating,
        comment: comment.trim() || undefined,
      });
      message.success('Cảm ơn bạn đã gửi đánh giá! Ý kiến của bạn giúp nâng cao chất lượng tư vấn. 💖');
      setIsFeedbackModalOpen(false);
      setFeedbackSessionId(null);
      setRating(5);
      setComment('');
    } catch (err: unknown) {
      let msg = 'Không thể gửi đánh giá phiên hỗ trợ';
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        msg = axiosErr.response?.data?.message || msg;
      }
      message.error(msg);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // ==========================================
  // VIEW 1: ACTIVE LIVE CHAT SESSION (Cả User & TNV)
  // ==========================================
  if (activeSession && activeSession.status === 'ACTIVE') {
    return (
      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 150px)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'var(--bg)',
        }}
      >
        {/* Chat Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--code-bg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserCheck size={22} color="#10b981" />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-h)' }}>
                {isVolunteer
                  ? 'Phiên tư vấn với Người dùng'
                  : 'Đang trò chuyện với Tình nguyện viên'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text)' }}>
                Mã phiên: {activeSession.id.slice(0, 8)}...
              </div>
            </div>
          </div>

          <Space>
            <Tag color={PRIORITY_COLOR_MAP[activeSession.priorityLevel]}>
              Ưu tiên: {activeSession.priorityLevel}
            </Tag>
            {isVolunteer && (
              <Button
                danger
                size="small"
                icon={<LogOut size={14} />}
                onClick={handleEndSession}
              >
                Kết thúc phiên
              </Button>
            )}
          </Space>
        </div>

        {/* Messages Stream */}
        <div
          style={{
            flex: 1,
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--text)',
                fontSize: '14px',
                margin: 'auto',
              }}
            >
              Hãy gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện.
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === user?.id;
              const timeStr = m.sentAt || m.createdAt;
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                    padding: '10px 16px',
                    borderRadius: isMe
                      ? '16px 16px 4px 16px'
                      : '16px 16px 16px 4px',
                    background: isMe ? 'var(--accent)' : 'var(--code-bg)',
                    color: isMe ? '#fff' : 'var(--text-h)',
                    fontSize: '14px',
                    lineHeight: 1.5,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                  }}
                >
                  <div style={{ wordBreak: 'break-word' }}>{m.content}</div>
                  <div
                    style={{
                      fontSize: '10px',
                      opacity: 0.75,
                      textAlign: 'right',
                      marginTop: '4px',
                    }}
                  >
                    {timeStr
                      ? new Date(timeStr).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Send Input Footer */}
        <form
          onSubmit={handleSendMessage}
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border)',
            background: 'var(--code-bg)',
            display: 'flex',
            gap: '10px',
          }}
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Nhập tin nhắn..."
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text-h)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
            }}
          >
            <Send size={16} /> Gửi
          </button>
        </form>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: VOLUNTEER WAITING QUEUE DASHBOARD
  // ==========================================
  if (isVolunteer) {
    const columns = [
      {
        title: 'Mã phiên',
        dataIndex: 'id',
        key: 'id',
        render: (id: string) => <Text code>{id.slice(0, 8)}...</Text>,
      },
      {
        title: 'Mức độ ưu tiên',
        dataIndex: 'priorityLevel',
        key: 'priorityLevel',
        render: (priority: PriorityLevel) => (
          <Tag color={PRIORITY_COLOR_MAP[priority]}>
            {PRIORITY_LABEL_MAP[priority] || priority}
          </Tag>
        ),
      },
      {
        title: 'Thời gian vào hàng đợi',
        key: 'queuedAt',
        render: (_: unknown, record: ChatSession) => {
          const time = record.queuedAt || record.createdAt;
          return (
            <span>
              {time ? new Date(time).toLocaleString('vi-VN') : 'Vừa xong'}
            </span>
          );
        },
      },
      {
        title: 'Hành động',
        key: 'action',
        render: (_: unknown, record: ChatSession) => (
          <Button
            type="primary"
            loading={acceptingId === record.id}
            onClick={() => handleAcceptSession(record.id)}
          >
            Nhận phiên
          </Button>
        ),
      },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0, color: 'var(--text-h)' }}>
              📋 Hàng đợi Yêu cầu Hỗ trợ Tâm lý
            </Title>
            <Text type="secondary">
              Danh sách các phiên chat đang chờ Tình nguyện viên tiếp nhận.
            </Text>
          </div>
          <Space size="middle">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-h)' }}>
                Sẵn sàng nhận phiên:
              </span>
              <Switch
                checked={isOnline}
                loading={togglingOnline}
                onChange={handleToggleOnline}
                checkedChildren="Bật"
                unCheckedChildren="Tắt"
              />
            </div>
            <Button
              icon={<RefreshCw size={14} />}
              loading={loadingQueue}
              onClick={fetchWaitingSessions}
            >
              Làm mới hàng đợi
            </Button>
          </Space>
        </div>

        <Card style={{ borderRadius: '12px', border: '1px solid var(--border)' }}>
          <Table
            dataSource={waitingSessions}
            columns={columns}
            rowKey="id"
            loading={loadingQueue}
            locale={{
              emptyText: 'Hiện không có người dùng nào đang chờ hỗ trợ.',
            }}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: USER WAITING SCREEN
  // ==========================================
  if (activeSession && activeSession.status === 'WAITING') {
    return (
      <div
        style={{
          maxWidth: '520px',
          margin: '40px auto',
          padding: '36px',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          background: 'var(--code-bg)',
          textAlign: 'center',
        }}
      >
        <Clock size={48} color="#f59e0b" style={{ marginBottom: '16px' }} />
        <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-h)' }}>
          Đang chờ Tình nguyện viên
        </h2>
        <p style={{ color: 'var(--text)', fontSize: '14px', marginBottom: '24px' }}>
          Yêu cầu của bạn đã được ghi nhận. Vui lòng giữ màn hình để tự động kết nối khi TNV tiếp nhận.
        </p>

        {queuePosition !== null && (
          <div
            style={{
              padding: '20px',
              borderRadius: '12px',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '14px', color: 'var(--text)' }}>
              Vị trí của bạn trong hàng đợi:
            </div>
            <div
              style={{
                fontSize: '36px',
                fontWeight: 800,
                color: 'var(--accent)',
              }}
            >
              #{queuePosition}
            </div>
          </div>
        )}

        <div style={{ fontSize: '13px', color: 'var(--text)' }}>
          Trạng thái kết nối: {' '}
          <strong style={{ color: isConnected ? '#10b981' : '#ef4444' }}>
            {isConnected ? 'Đã kết nối Socket' : 'Đang kết nối lại...'}
          </strong>
        </div>

        <div style={{ marginTop: '24px' }}>
          <Popconfirm
            title="Huỷ yêu cầu tư vấn"
            description="Bạn có chắc chắn muốn huỷ yêu cầu và rời khỏi hàng đợi?"
            onConfirm={handleCancelSession}
            okText="Huỷ yêu cầu"
            cancelText="Tiếp tục đợi"
            okButtonProps={{ danger: true }}
          >
            <Button danger loading={cancellingSession}>
              Huỷ yêu cầu tư vấn
            </Button>
          </Popconfirm>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 4: USER INITIAL STATE (Hoặc No Volunteer Emergency Alert)
  // ==========================================
  return (
    <>
      <div
        style={{
        maxWidth: '580px',
        margin: '40px auto',
        padding: '36px',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        background: 'var(--code-bg)',
        textAlign: 'center',
      }}
    >
      {isRequesting ? (
        <LoadingSpinner message="Đang kết nối và kiểm tra hàng đợi..." />
      ) : noVolunteerInfo.noVolunteer ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Alert
            type="warning"
            showIcon
            icon={<PhoneCall size={24} color="#f59e0b" />}
            message="Hiện không có Tình nguyện viên trực tuyến"
            description={
              <div style={{ marginTop: '8px', lineHeight: 1.6, textAlign: 'left' }}>
                <p style={{ margin: '0 0 8px 0' }}>
                  Rất tiếc, hiện tại không có tình nguyện viên nào đang trực tiếp nhận phiên chat.
                </p>
                <p style={{ margin: 0 }}>
                  Trong trường hợp khẩn cấp hoặc cần hỗ trợ ngay lập tức, vui lòng liên hệ đường dây nóng:
                  <strong style={{ display: 'block', fontSize: '18px', color: 'var(--accent)', marginTop: '4px' }}>
                    📞 {noVolunteerInfo.hotline || import.meta.env.VITE_EMERGENCY_HOTLINE || '1900 6789'}
                  </strong>
                </p>
              </div>
            }
          />
          <Button
            type="primary"
            size="large"
            onClick={handleRequestSupport}
            style={{ alignSelf: 'center' }}
          >
            Thử kết nối lại
          </Button>
        </div>
      ) : (
        <div>
          <MessageSquare
            size={48}
            color="var(--accent)"
            style={{ marginBottom: '16px' }}
          />
          <h2 style={{ margin: '0 0 12px 0', color: 'var(--text-h)' }}>
            Tư vấn Tâm lý Trực tiếp
          </h2>
          <p
            style={{
              color: 'var(--text)',
              fontSize: '15px',
              lineHeight: 1.6,
              marginBottom: '28px',
            }}
          >
            Bạn đang trải qua cảm xúc khó khăn và cần người lắng nghe? Hãy gửi yêu cầu hỗ trợ để kết nối riêng tư 1-1 với Tình nguyện viên tâm lý.
          </p>
          <Button
            type="primary"
            size="large"
            onClick={handleRequestSupport}
            style={{
              padding: '0 32px',
              height: '48px',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: '10px',
            }}
          >
            Yêu cầu tư vấn ngay
          </Button>
        </div>
      )}
    </div>

    {/* Modal Đánh giá phiên hỗ trợ (PB-27) */}
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Heart size={20} color="#e11d48" />
          <span>Đánh giá phiên hỗ trợ tâm lý (PB-27)</span>
        </div>
      }
      open={isFeedbackModalOpen}
      onCancel={() => {
        setIsFeedbackModalOpen(false);
        setFeedbackSessionId(null);
      }}
      footer={null}
      destroyOnClose
      centered
      width={480}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text)', lineHeight: 1.5 }}>
          Phiên tư vấn vừa kết thúc. Hãy dành ít phút để gửi đánh giá và nhận xét về buổi trò chuyện cùng Tình nguyện viên nhé!
        </p>

        <div
          style={{
            padding: '16px',
            borderRadius: '12px',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '8px' }}>
            Mức độ hài lòng của bạn:
          </div>
          <Rate
            allowClear={false}
            value={rating}
            onChange={setRating}
            style={{ fontSize: 32, color: '#f59e0b' }}
          />
          <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-h)' }}>
            {RATING_DESC[rating - 1]}
          </div>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--text-h)',
              marginBottom: '6px',
            }}
          >
            Nhận xét hoặc lời nhắn gửi đến Tình nguyện viên (tùy chọn):
          </label>
          <Input.TextArea
            rows={3}
            maxLength={1000}
            showCount
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ cảm xúc của bạn hoặc góp ý để chúng tôi cải thiện tốt hơn..."
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <Button
            onClick={() => {
              setIsFeedbackModalOpen(false);
              setFeedbackSessionId(null);
            }}
          >
            Để sau
          </Button>
          <Button
            type="primary"
            onClick={handleSubmitFeedback}
            loading={submittingFeedback}
            icon={<Star size={14} />}
            style={{ background: 'var(--accent)', borderColor: 'var(--accent)' }}
          >
            Gửi đánh giá
          </Button>
        </div>
      </div>
    </Modal>
  </>
  );
};
