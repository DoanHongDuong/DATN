import {
  ChatSession,
  ChatMessage,
  SessionStatus,
  PriorityLevel,
  SeverityLevel,
} from '@prisma/client';

export const CHAT_REPOSITORY = Symbol('CHAT_REPOSITORY');

export interface IChatRepository {
  /**
   * Tìm phiên đang WAITING hoặc ACTIVE của user (business rule: 1 user = 1 phiên tại 1 thời điểm)
   */
  findActiveOrWaitingSessionByUserId(userId: string): Promise<ChatSession | null>;

  /**
   * Lấy severity_level gần nhất từ test_results của user
   */
  findLatestSeverityByUserId(userId: string): Promise<SeverityLevel | null>;

  /**
   * Kiểm tra có TNV nào is_online = true VÀ is_verified = true không
   */
  hasAvailableVolunteer(): Promise<boolean>;

  /**
   * Tạo chat session mới
   */
  createSession(data: {
    userId: string;
    priorityLevel: PriorityLevel;
    status: SessionStatus;
  }): Promise<ChatSession>;

  /**
   * Tìm session theo ID
   */
  findSessionById(sessionId: string): Promise<ChatSession | null>;

  /**
   * Accept phiên: dùng transaction để tránh race condition
   * Chỉ update nếu session vẫn WAITING và volunteer_id vẫn null
   * Trả về null nếu điều kiện không thoả (đã bị người khác nhận)
   */
  acceptSession(sessionId: string, volunteerId: string): Promise<ChatSession | null>;

  /**
   * Đóng phiên: update status = CLOSED, ended_at
   */
  closeSession(sessionId: string): Promise<ChatSession>;

  /**
   * Lưu tin nhắn chat
   */
  createMessage(data: {
    sessionId: string;
    senderId: string;
    content: string;
  }): Promise<ChatMessage>;

  /**
   * Lấy lịch sử tin nhắn của session
   */
  findMessagesBySessionId(sessionId: string): Promise<ChatMessage[]>;

  /**
   * Đếm số phiên WAITING có priority_level >= priorityLevel của session hiện tại
   * VÀ được tạo trước session hiện tại (queuedAt) → vị trí trong hàng đợi
   */
  getQueuePosition(sessionId: string): Promise<number>;
}
