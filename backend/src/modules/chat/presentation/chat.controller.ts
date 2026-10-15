import {
  Controller,
  Post,
  Get,
  Param,
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
import { GetQueuePositionUseCase } from '../application/use-cases/get-queue-position.use-case';
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
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: IChatRepository,
    private readonly chatGateway: ChatGateway,
  ) { }

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
}
