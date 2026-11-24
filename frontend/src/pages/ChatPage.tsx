import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Card, Alert, message, Typography, Switch, Popconfirm, Modal, Rate, Input } from 'antd';
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
  Wind,
  ShieldCheck,
  CheckCircle2,
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
import { getEmergencyHotline } from '../utils/hotline';
import './chat.css';

const { Text } = Typography;

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
  const navigate = useNavigate();
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
  const isEndingSessionRef = useRef<boolean>(false);
  const acceptedSessionToastRef = useRef<string | null>(null);
  const endedSessionToastRef = useRef<string | null>(null);

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

    const onSessionAccepted = (session: ChatSession) => {
      setActiveSession(session);
      setQueuePosition(null);
      loadMessages(session.id);
      socket.emit('join_session', { sessionId: session.id });
      // Deduplicate toast: only show once per session ID
      if (acceptedSessionToastRef.current !== session.id) {
        acceptedSessionToastRef.current = session.id;
        message.success('Tình nguyện viên đã tham gia cuộc trò chuyện!');
      }
    };

    const onNewMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    const onSessionEnded = (closedSession?: ChatSession) => {
      const endedSessionId = closedSession?.id || activeSessionRef.current?.id;
      setActiveSession(null);
      setMessages([]);
      // Only display the toast if not already shown locally and not already displayed for this session
      if (!isEndingSessionRef.current && endedSessionId && endedSessionToastRef.current !== endedSessionId) {
        endedSessionToastRef.current = endedSessionId;
        message.info('Phiên tư vấn hỗ trợ đã kết thúc.');
      }
      isEndingSessionRef.current = false;
      if (isVolunteer) {
        fetchWaitingSessions();
      } else if (endedSessionId) {
        setFeedbackSessionId(endedSessionId);
        setIsFeedbackModalOpen(true);
      }
    };

    const onQueueChanged = () => {
      if (isVolunteer && !activeSessionRef.current) {
        fetchWaitingSessions();
      }
    };

    socket.on('session_accepted', onSessionAccepted);
    socket.on('new_message', onNewMessage);
    socket.on('session_ended', onSessionEnded);
    socket.on('new_waiting_session', onQueueChanged);
    socket.on('waiting_session_accepted', onQueueChanged);

    return () => {
      socket.off('session_accepted', onSessionAccepted);
      socket.off('new_message', onNewMessage);
      socket.off('session_ended', onSessionEnded);
      socket.off('new_waiting_session', onQueueChanged);
      socket.off('waiting_session_accepted', onQueueChanged);
    };
  }, [socket, loadMessages, isVolunteer, fetchWaitingSessions]);

  useEffect(() => {
    if (socket && activeSession && activeSession.status === 'ACTIVE') {
      socket.emit('join_session', { sessionId: activeSession.id });
    }
  }, [socket, activeSession]);

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

  const handleEndSession = () => {
    if (!activeSession) return;
    Modal.confirm({
      title: 'Kết thúc phiên tư vấn',
      content: 'Bạn có chắc chắn muốn kết thúc phiên tư vấn này?',
      okText: 'Kết thúc',
      okType: 'danger',
      cancelText: 'Tiếp tục trò chuyện',
      centered: true,
      onOk: async () => {
        isEndingSessionRef.current = true;
        try {
          await chatApi.endSession(activeSession.id);
          if (socket) {
            socket.emit('end_session', { sessionId: activeSession.id });
          }
          setActiveSession(null);
          setMessages([]);
          message.success('Đã kết thúc phiên hỗ trợ.');
          if (isVolunteer) {
            fetchWaitingSessions();
          }
        } catch (err: unknown) {
          isEndingSessionRef.current = false;
          let msg = 'Không thể kết thúc phiên hỗ trợ';
          if (axios.isAxiosError(err)) {
            const axiosErr = err as AxiosError<{ message?: string }>;
            msg = axiosErr.response?.data?.message || msg;
          }
          message.error(msg);
        }
      },
    });
  };

  const handleRequestSupport = async () => {
    setIsRequesting(true);
    setNoVolunteerInfo({ noVolunteer: false });
    try {
      const response = await chatApi.requestSupport();

      if (response.noVolunteerAvailable) {
        setNoVolunteerInfo({
          noVolunteer: true,
          hotline: getEmergencyHotline(response.hotline),
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeSession) return;

    if (!socket || !isConnected) {
      message.warning('Đang kết nối lại máy chủ trò chuyện, vui lòng thử lại sau giây lát...');
      return;
    }

    socket.emit('send_message', {
      sessionId: activeSession.id,
      content: inputMessage.trim(),
    });

    setInputMessage('');
  };

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
      <div className="chat-container">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-header__left">
            <div className="chat-header__avatar">
              <UserCheck size={22} />
            </div>
            <div>
              <h2 className="chat-header__title">
                {isVolunteer ? 'Phiên tư vấn với Người dùng' : 'Tình nguyện viên hỗ trợ tâm lý'}
              </h2>
              <div className="chat-header__subtitle">
                <span>Mã phiên: {activeSession.id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>

          <div className="chat-header__right">
            <span
              className={`chat-status-pill ${
                isConnected ? 'chat-status-pill--online' : 'chat-status-pill--offline'
              }`}
            >
              {isConnected ? '● Trực tuyến' : '○ Đang kết nối'}
            </span>
            <Tag color={PRIORITY_COLOR_MAP[activeSession.priorityLevel]} className="chat-priority-pill">
              Ưu tiên: {activeSession.priorityLevel}
            </Tag>
            <Button
              danger
              size="small"
              icon={<LogOut size={14} />}
              onClick={handleEndSession}
              className="chat-end-btn"
            >
              Kết thúc phiên
            </Button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="chat-messages-stream">
          {messages.length === 0 ? (
            <div className="chat-empty-state">
              <div className="chat-empty-state__icon">
                <MessageSquare size={24} />
              </div>
              <p className="chat-empty-state__text">
                Đây là không gian an toàn để bạn chia sẻ. Hãy bắt đầu bằng bất kỳ điều gì bạn cảm thấy thoải mái nhất.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderId === user?.id;
              const timeStr = m.sentAt || m.createdAt;
              return (
                <div
                  key={m.id}
                  className={`chat-message-row ${
                    isMe ? 'chat-message-row--me' : 'chat-message-row--partner'
                  }`}
                >
                  <div className={`chat-bubble ${isMe ? 'chat-bubble--me' : 'chat-bubble--partner'}`}>
                    <div>{m.content}</div>
                    <div className="chat-bubble__time">
                      {timeStr
                        ? new Date(timeStr).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Send Input Composer */}
        <form onSubmit={handleSendMessage} className="chat-composer">
          <Input
            size="large"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onPressEnter={handleSendMessage}
            placeholder="Bạn có thể chia sẻ những điều đang khiến mình bận lòng..."
            className="chat-composer__input"
            aria-label="Nhập tin nhắn trò chuyện"
          />
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            icon={<Send size={16} />}
            className="chat-composer__send-btn"
          >
            Gửi
          </Button>
        </form>
      </div>
    );
  }

  // ==========================================
  // VIEW: ADMIN ROLE NOTICE
  // ==========================================
  if (user?.role === 'ADMIN') {
    return (
      <div className="chat-idle-card">
        <div className="chat-idle-icon">
          <ShieldCheck size={32} />
        </div>
        <h2 className="chat-idle-title">
          Cổng Giám sát Kênh Tư vấn Trực tuyến
        </h2>
        <Alert
          type="info"
          showIcon
          message="Phân tách vai trò Quản trị viên (Separation of Duties)"
          description={
            <div style={{ textAlign: 'left', lineHeight: 1.6, marginTop: '8px' }}>
              <p style={{ margin: '0 0 8px 0' }}>
                Bạn đang đăng nhập với tư cách <strong>Quản trị viên hệ thống (ADMIN)</strong>. Theo nguyên tắc phân tách trách nhiệm và chuẩn mực đạo đức sơ cứu tâm lý (PFA):
              </p>
              <ul style={{ margin: '0 0 8px 0', paddingLeft: '20px' }}>
                <li>Tài khoản Quản trị không tham gia vào hàng đợi để yêu cầu tư vấn với Tình nguyện viên do chính mình quản lý.</li>
                <li>Để kiểm thử luồng Người dùng gửi yêu cầu hỗ trợ và trao đổi 1-1 với TNV, vui lòng sử dụng tài khoản thử nghiệm có vai trò <strong>USER</strong>.</li>
              </ul>
            </div>
          }
          style={{ marginBottom: '24px', textAlign: 'left' }}
        />

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            type="primary"
            size="large"
            onClick={() => navigate('/admin')}
            style={{ borderRadius: '8px', fontWeight: 600 }}
          >
            Quản trị hệ thống
          </Button>
          <Button
            size="large"
            onClick={() => navigate('/admin/stats')}
            style={{ borderRadius: '8px', fontWeight: 600 }}
          >
            Thống kê phiên tư vấn
          </Button>
        </div>
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
            style={{ borderRadius: '8px', fontWeight: 600 }}
          >
            Nhận phiên
          </Button>
        ),
      },
    ];

    return (
      <div className="chat-volunteer-queue-page">
        <div className="chat-queue-header">
          <div>
            <h1 className="chat-queue-title">
              Hàng đợi Yêu cầu Hỗ trợ Tâm lý
            </h1>
            <p className="chat-queue-desc">
              Danh sách các phiên trò chuyện đang chờ Tình nguyện viên tiếp nhận.
            </p>
          </div>
          <div className="chat-queue-actions">
            <div className="chat-queue-status-pill">
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
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
              style={{ borderRadius: '8px' }}
            >
              Làm mới hàng đợi
            </Button>
          </div>
        </div>

        <Card className="chat-queue-card">
          {waitingSessions.length === 0 && !loadingQueue ? (
            <div className="chat-queue-empty">
              <div className="chat-queue-empty__icon">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="chat-queue-empty__title">
                Hiện chưa có yêu cầu hỗ trợ nào đang chờ
              </h3>
              <p className="chat-queue-empty__desc">
                Bạn có thể tiếp tục sẵn sàng tiếp nhận phiên mới. Khi có sinh viên gửi yêu cầu hỗ trợ, hệ thống sẽ tự động cập nhật danh sách tại đây.
              </p>
              <div className="chat-queue-empty__badge">
                <span className={`chat-status-dot ${isOnline ? 'chat-status-dot--online' : 'chat-status-dot--offline'}`} />
                <span>
                  Trạng thái: <strong>{isOnline ? 'Đang sẵn sàng nhận phiên' : 'Đang tạm dừng nhận phiên'}</strong>
                </span>
              </div>
            </div>
          ) : (
            <Table
              dataSource={waitingSessions}
              columns={columns}
              rowKey="id"
              loading={loadingQueue}
              locale={{
                emptyText: 'Hiện không có sinh viên nào đang chờ hỗ trợ.',
              }}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 650 }}
            />
          )}
        </Card>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: USER WAITING SCREEN
  // ==========================================
  if (activeSession && activeSession.status === 'WAITING') {
    return (
      <div className="chat-waiting-card">
        <div>
          <Clock size={44} color="var(--color-warning)" style={{ marginBottom: '12px' }} />
          <h2 style={{ margin: '0 0 8px 0', fontFamily: 'var(--heading)', fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Đang chờ Tình nguyện viên kết nối
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
            Yêu cầu của bạn đã được ghi nhận. Vui lòng giữ màn hình để tự động kết nối khi Tình nguyện viên tiếp nhận.
          </p>
        </div>

        {queuePosition !== null && (
          <div className="chat-waiting-queue-box">
            <div style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600 }}>
              Vị trí của bạn trong hàng đợi tiếp nhận:
            </div>
            <div className="chat-waiting-queue-number">
              #{queuePosition}
            </div>
          </div>
        )}

        {/* Calming Breathing Pacer during queue wait */}
        <div className="chat-waiting-pacer-box">
          <div
            style={{
              fontSize: '13.5px',
              fontWeight: 600,
              color: 'var(--color-primary)',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Wind size={16} />
            <span>Xoa dịu cảm xúc trong lúc chờ đợi</span>
          </div>

          <div className="chat-waiting-pacer-circle">
            Hít vào • Thở ra
          </div>

          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Người lắng nghe đang trên đường đến với bạn. Hãy nhắm mắt lại, hít một hơi thật sâu bằng mũi và thở ra chậm rãi bằng miệng nhé...
          </p>
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Trạng thái kết nối: {' '}
          <strong style={{ color: isConnected ? 'var(--color-success)' : 'var(--color-crisis)' }}>
            {isConnected ? 'Đã kết nối máy chủ' : 'Đang kết nối lại...'}
          </strong>
        </div>

        <div>
          <Popconfirm
            title="Huỷ yêu cầu tư vấn"
            description="Bạn có chắc chắn muốn huỷ yêu cầu và rời khỏi hàng đợi?"
            onConfirm={handleCancelSession}
            okText="Huỷ yêu cầu"
            cancelText="Tiếp tục đợi"
            okButtonProps={{ danger: true }}
          >
            <Button danger loading={cancellingSession} style={{ borderRadius: '8px', fontWeight: 600 }}>
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
      <div className="chat-idle-card">
        {isRequesting ? (
          <LoadingSpinner message="Đang kết nối và kiểm tra hàng đợi..." />
        ) : noVolunteerInfo.noVolunteer ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Alert
              type="warning"
              showIcon
              icon={<PhoneCall size={24} color="var(--color-warning)" />}
              message="Hiện không có Tình nguyện viên trực tuyến"
              description={
                <div style={{ marginTop: '8px', lineHeight: 1.6, textAlign: 'left' }}>
                  <p style={{ margin: '0 0 8px 0' }}>
                    Rất tiếc, hiện tại không có tình nguyện viên nào đang trực tiếp nhận phiên chat.
                  </p>
                  <p style={{ margin: 0 }}>
                    Trong trường hợp khẩn cấp hoặc cần hỗ trợ ngay lập tức, vui lòng liên hệ đường dây nóng 24/7:
                    <strong style={{ display: 'block', fontSize: '18px', color: 'var(--color-crisis)', marginTop: '4px' }}>
                      📞 {getEmergencyHotline(noVolunteerInfo.hotline)}
                    </strong>
                  </p>
                </div>
              }
            />
            <Button
              type="primary"
              size="large"
              onClick={handleRequestSupport}
              style={{ alignSelf: 'center', borderRadius: '8px', fontWeight: 600 }}
            >
              Thử kết nối lại
            </Button>
          </div>
        ) : (
          <div>
            <div className="chat-idle-icon">
              <MessageSquare size={28} />
            </div>
            <h1 className="chat-idle-title">
              Tư vấn Tâm lý Trực tiếp
            </h1>
            <p className="chat-idle-desc">
              Bạn đang trải qua cảm xúc khó khăn và cần người lắng nghe? Hãy gửi yêu cầu hỗ trợ để kết nối riêng tư 1-1 với Tình nguyện viên tâm lý.
            </p>
            <Button
              type="primary"
              size="large"
              onClick={handleRequestSupport}
              style={{
                padding: '0 32px',
                height: '48px',
                fontSize: '15px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-crisis)', fontSize: '17px' }}>
            <Heart size={20} />
            <span>Đánh giá phiên hỗ trợ tâm lý</span>
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
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Phiên tư vấn vừa kết thúc. Hãy dành ít phút để gửi đánh giá và nhận xét về buổi trò chuyện cùng Tình nguyện viên nhé!
          </p>

          <div
            style={{
              padding: '16px',
              borderRadius: '14px',
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Mức độ hài lòng của bạn:
            </div>
            <Rate
              allowClear={false}
              value={rating}
              onChange={setRating}
              style={{ fontSize: 32, color: '#f59e0b' }}
            />
            <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {RATING_DESC[rating - 1]}
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13.5px',
                fontWeight: 600,
                color: 'var(--text-primary)',
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
              style={{ borderRadius: '8px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button
              onClick={() => {
                setIsFeedbackModalOpen(false);
                setFeedbackSessionId(null);
              }}
              style={{ borderRadius: '8px' }}
            >
              Để sau
            </Button>
            <Button
              type="primary"
              onClick={handleSubmitFeedback}
              loading={submittingFeedback}
              icon={<Star size={14} />}
              style={{ borderRadius: '8px', fontWeight: 600 }}
            >
              Gửi đánh giá
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
