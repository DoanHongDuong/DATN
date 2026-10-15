import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { ListTestsUseCase } from '../application/use-cases/list-tests.use-case';
import { GetTestQuestionsUseCase } from '../application/use-cases/get-test-questions.use-case';
import { SubmitTestUseCase } from '../application/use-cases/submit-test.use-case';
import { GetTestHistoryUseCase } from '../application/use-cases/get-test-history.use-case';
import { SubmitTestDto } from '../application/dto/submit-test.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    role: string;
  };
}

@ApiTags('Assessments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assessments')
export class AssessmentController {
  constructor(
    private readonly listTestsUseCase: ListTestsUseCase,
    private readonly getTestQuestionsUseCase: GetTestQuestionsUseCase,
    private readonly submitTestUseCase: SubmitTestUseCase,
    private readonly getTestHistoryUseCase: GetTestHistoryUseCase,
  ) {}

  @ApiOperation({ summary: 'Lấy danh sách bài đánh giá tâm lý (PHQ-9, GAD-7)' })
  @Get()
  async listTests() {
    return this.listTestsUseCase.execute();
  }

  @ApiOperation({ summary: 'Lấy lịch sử làm bài đánh giá của người dùng' })
  @Get('history')
  async getHistory(
    @Req() req: AuthenticatedRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.getTestHistoryUseCase.execute(req.user.userId, page, limit);
  }

  @ApiOperation({ summary: 'Lấy danh sách câu hỏi của một bài đánh giá' })
  @Get(':id/questions')
  async getQuestions(@Param('id') id: string) {
    return this.getTestQuestionsUseCase.execute(id);
  }

  @ApiOperation({ summary: 'Nộp bài đánh giá tâm lý và nhận kết quả' })
  @Post(':id/submit')
  async submitTest(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: SubmitTestDto,
  ) {
    return this.submitTestUseCase.execute(req.user.userId, id, dto);
  }
}
