import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatSession } from '@prisma/client';
import { SendMessageUseCase } from '../application/use-cases/send-message.use-case';
import { EndSessionUseCase } from '../application/use-cases/end-session.use-case';
import { IChatRepository } from '../domain/repositories/chat.repository.interface';
import { Inject } from '@nestjs/common';
import { CHAT_REPOSITORY } from '../domain/repositories/chat.repository.interface';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    role: string;
  };
}

interface JwtPayload {
  sub: string;
  role: string;
}

@Injectable()
@WebSocketGateway()
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly endSessionUseCase: EndSessionUseCase,
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: IChatRepository,
  ) { }

  afterInit(server: Server) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    server.engine.opts.cors = {
      origin: frontendUrl,
      credentials: true,
    };
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cors = require('cors');
    (server.engine as any).use(
      cors({
        origin: frontendUrl,
        credentials: true,
      }),
    );
  }

  /**
   * Xác thực JWT ngay lúc handshake.
   * Hỗ trợ đọc token từ:
   * 1. handshake.auth.token (Socket.IO client tiêu chuẩn)
   * 2. handshake.headers.authorization ("Bearer <token>" trong Headers)
   * 3. handshake.query.token ("?token=<token>" trong URL)
   */
  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn('Socket connection rejected: no token provided');
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // Gắn userId và role vào socket data
      client.data.userId = payload.sub;
      client.data.role = payload.role;

      // Tự động join room theo userId để nhận thông báo cá nhân
      await client.join(`user:${payload.sub}`);

      this.logger.log(`Socket connected: userId=${payload.sub}`);
    } catch {
      this.logger.warn('Socket connection rejected: invalid token');
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    // KHÔNG tự động đóng session khi mất kết nối tạm thời
    // Chỉ đóng khi TNV chủ động end_session
    // TODO: Timeout không hoạt động quá lâu (chưa cần code ngay)
    if (client.data?.userId) {
      this.logger.log(`Socket disconnected: userId=${client.data.userId}`);
    }
  }

  /**
   * Sự kiện 'join_session'
   * Client join vào room theo sessionId
   * Kiểm tra user/volunteer thuộc session trước khi cho join
   */
  @SubscribeMessage('join_session')
  async handleJoinSession(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { sessionId: string },
  ): Promise<{ success: boolean; error?: string }> {
    if (!data?.sessionId) {
      return { success: false, error: 'Thiếu sessionId' };
    }

    const session = await this.chatRepository.findSessionById(data.sessionId);
    if (!session) {
      return { success: false, error: 'Không tìm thấy phiên hỗ trợ' };
    }

    const userId = client.data.userId;
    if (session.userId !== userId && session.volunteerId !== userId) {
      return { success: false, error: 'Bạn không thuộc phiên hỗ trợ này' };
    }

    await client.join(`session:${data.sessionId}`);
    this.logger.log(
      `User ${userId} joined session room: session:${data.sessionId}`,
    );

    return { success: true };
  }

  /**
   * Sự kiện 'send_message'
   * Nhận { sessionId, content }, gọi SendMessageUseCase lưu DB,
   * broadcast 'new_message' cho room
   */
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { sessionId: string; content: string },
  ): Promise<{ success: boolean; error?: string }> {
    if (!data?.sessionId || !data?.content) {
      return { success: false, error: 'Thiếu sessionId hoặc content' };
    }

    try {
      const message = await this.sendMessageUseCase.execute(
        client.data.userId,
        data.sessionId,
        data.content,
      );

      // Broadcast cho cả room (bao gồm cả người gửi)
      this.server
        .to(`session:${data.sessionId}`)
        .emit('new_message', message);

      return { success: true };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Không thể gửi tin nhắn';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sự kiện 'end_session' — chỉ TNV
   * Gọi EndSessionUseCase, broadcast 'session_ended' cho cả 2 bên
   */
  @SubscribeMessage('end_session')
  async handleEndSession(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { sessionId: string },
  ): Promise<{ success: boolean; error?: string }> {
    if (!data?.sessionId) {
      return { success: false, error: 'Thiếu sessionId' };
    }

    try {
      const closedSession = await this.endSessionUseCase.execute(
        client.data.userId,
        data.sessionId,
      );

      // Broadcast 'session_ended' cho cả 2 bên
      this.server
        .to(`session:${data.sessionId}`)
        .emit('session_ended', closedSession);

      return { success: true };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Không thể kết thúc phiên';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Emit sự kiện 'session_accepted' tới đúng user đang chờ
   * Được gọi từ ChatController sau khi AcceptSessionUseCase thành công
   */
  emitSessionAccepted(userId: string, session: ChatSession): void {
    this.server.to(`user:${userId}`).emit('session_accepted', session);
  }

  /**
   * Trích xuất JWT token từ handshake auth, headers, hoặc query
   */
  private extractToken(client: AuthenticatedSocket): string | undefined {
    // 1. Từ handshake.auth.token (Socket.IO client tiêu chuẩn)
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    // 2. Từ handshake.headers.authorization ("Bearer <token>" hoặc raw token)
    const authHeader = client.handshake.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader.length > 0) {
      const [type, token] = authHeader.split(' ');
      return type === 'Bearer' && token ? token : authHeader;
    }

    // 3. Từ query params (?token=<token>)
    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string' && queryToken.length > 0) {
      return queryToken;
    }

    return undefined;
  }
}
