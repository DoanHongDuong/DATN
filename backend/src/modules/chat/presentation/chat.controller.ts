import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
  Inject,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { RequestSupportUseCase } from '../application/use-cases/request-support.use-case';
import { AcceptSessionUseCase } from '../application/use-cases/accept-session.use-case';
import { EndSessionUseCase } from '../application/use-cases/end-session.use-case';
import { GetQueuePositionUseCase } from '../application/use-cases/get-queue-position.use-case';
import { GetMyActiveSessionUseCase } from '../application/use-cases/get-my-active-session.use-case';
import { CancelSessionUseCase } from '../application/use-cases/cancel-session.use-case';
import { SubmitSessionFeedbackUseCase } from '../application/use-cases/submit-session-feedback.use-case';
import { GetSessionFeedbackUseCase } from '../application/use-cases/get-session-feedback.use-case';
import { CreateFeedbackDto } from '../application/dto/create-feedback.dto';
import {
  CHAT_REPOSITORY,
  IChatRepository,
} from '../domain/repositories/chat.repository.interface';
import { ChatGateway } from './chat.gateway';
import { Role } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: { userId: string; role: string };
}

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly requestSupportUseCase: RequestSupportUseCase,
    private readonly acceptSessionUseCase: AcceptSessionUseCase,
    private readonly getQueuePositionUseCase: GetQueuePositionUseCase,
    private readonly getMyActiveSessionUseCase: GetMyActiveSessionUseCase,
    private readonly cancelSessionUseCase: CancelSessionUseCase,
    private readonly endSessionUseCase: EndSessionUseCase,
    private readonly submitSessionFeedbackUseCase: SubmitSessionFeedbackUseCase,
    private readonly getSessionFeedbackUseCase: GetSessionFeedbackUseCase,
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: IChatRepository,
    private readonly chatGateway: ChatGateway,
  ) { }

  /**
   * GET /chat/my-active-session
   * Lấy phiên chat hiện tại (đang đợi hoặc đang chat) của user / tình nguyện viên
   */
  @ApiOperation({ summary: 'Lấy phiên chat hiện tại của người dùng hoặc TNV' })
  @Get('my-active-session')
  async getMyActiveSession(@Req() req: AuthenticatedRequest) {
    return this.getMyActiveSessionUseCase.execute(req.user.userId, req.user.role);
  }

  /**
   * POST /chat/:id/cancel
   * User hủy yêu cầu hỗ trợ hoặc thoát khỏi hàng đợi
   */
  @ApiOperation({ summary: 'Huỷ yêu cầu hỗ trợ hoặc kết thúc phiên từ phía người dùng' })
  @Post(':id/cancel')
  async cancelSession(
    @Param('id') sessionId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const session = await this.cancelSessionUseCase.execute(req.user.userId, sessionId);
    this.chatGateway.server
      .to(`session:${sessionId}`)
      .emit('session_ended', session);
    return session;
  }

  /**
   * POST /chat/request-support
   * UC-06: User yêu cầu hỗ trợ tâm lý
   */
  @ApiOperation({ summary: 'Yêu cầu tư vấn hỗ trợ tâm lý' })
  @Post('request-support')
  async requestSupport(@Req() req: AuthenticatedRequest) {
    return this.requestSupportUseCase.execute(req.user.userId);
  }

  /**
   * POST /chat/:id/accept
   * UC-07: TNV nhận phiên hỗ trợ
   */
  @ApiOperation({ summary: 'Tình nguyện viên chấp nhận phiên hỗ trợ' })
  @Post(':id/accept')
  async acceptSession(
    @Param('id') sessionId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    if (req.user.role !== Role.VOLUNTEER) {
      throw new ForbiddenException('Chỉ tình nguyện viên mới có thể nhận phiên');
    }

    const session = await this.acceptSessionUseCase.execute(
      req.user.userId,
      sessionId,
    );

    // Emit sự kiện 'session_accepted' tới user đang chờ
    this.chatGateway.emitSessionAccepted(session.userId, session);

    return session;
  }

  /**
   * POST /chat/:id/end
   * UC-08: Kết thúc phiên hỗ trợ
   */
  @ApiOperation({ summary: 'Kết thúc phiên hỗ trợ (TNV hoặc User)' })
  @Post(':id/end')
  async endSession(
    @Param('id') sessionId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const closedSession = await this.endSessionUseCase.execute(
      req.user.userId,
      sessionId,
    );

    // Broadcast sự kiện 'session_ended' tới room session qua Socket.IO
    this.chatGateway.emitSessionEnded(sessionId, closedSession);

    return closedSession;
  }

  /**
   * GET /chat/:id/queue-position
   * PB-20: Lấy vị trí trong hàng đợi
   */
  @ApiOperation({ summary: 'Lấy vị trí của phiên chat trong hàng đợi' })
  @Get(':id/queue-position')
  async getQueuePosition(
    @Param('id') sessionId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.getQueuePositionUseCase.execute(req.user.userId, sessionId);
  }

  /**
   * GET /chat/:id/messages
   * Lấy lịch sử tin nhắn khi mới join (trước khi nhận tin real-time)
   */
  @ApiOperation({ summary: 'Lấy lịch sử tin nhắn của phiên chat' })
  @Get(':id/messages')
  async getMessages(
    @Param('id') sessionId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    // Kiểm tra user có thuộc session này không
    const session = await this.chatRepository.findSessionById(sessionId);
    if (!session) {
      throw new ForbiddenException('Không tìm thấy phiên hỗ trợ');
    }
    if (
      session.userId !== req.user.userId &&
      session.volunteerId !== req.user.userId
    ) {
      throw new ForbiddenException('Bạn không có quyền xem tin nhắn của phiên này');
    }

    return this.chatRepository.findMessagesBySessionId(sessionId);
  }

  /**
   * GET /chat/waiting-sessions
   * TNV lấy danh sách các phiên đang chờ trong hàng đợi
   */
  @ApiOperation({ summary: 'Lấy danh sách các phiên đang chờ TNV nhận' })
  @Get('waiting-sessions')
  async getWaitingSessions(@Req() req: AuthenticatedRequest) {
    if (req.user.role !== Role.VOLUNTEER && req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ tình nguyện viên mới có thể xem danh sách hàng đợi');
    }
    return this.chatRepository.findWaitingSessions();
  }

  /**
   * POST /chat/:id/feedback
   * Gửi đánh giá chất lượng phiên hỗ trợ (PB-27)
   */
  @ApiOperation({ summary: 'Gửi đánh giá chất lượng phiên hỗ trợ (PB-27)' })
  @Post(':id/feedback')
  async submitFeedback(
    @Param('id') sessionId: string,
    @Body() dto: CreateFeedbackDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.submitSessionFeedbackUseCase.execute(
      req.user.userId,
      sessionId,
      dto,
    );
  }

  /**
   * GET /chat/:id/feedback
   * Xem đánh giá của phiên hỗ trợ
   */
  @ApiOperation({ summary: 'Xem đánh giá của phiên hỗ trợ' })
  @Get(':id/feedback')
  async getFeedback(
    @Param('id') sessionId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.getSessionFeedbackUseCase.execute(
      req.user.userId,
      sessionId,
    );
  }
}
