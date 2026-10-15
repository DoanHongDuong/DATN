import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/presentation/guards/jwt-auth.guard';
import { CreateJournalEntryUseCase } from '../application/use-cases/create-journal-entry.use-case';
import { GetJournalEntriesUseCase } from '../application/use-cases/get-journal-entries.use-case';
import { UpdateJournalEntryUseCase } from '../application/use-cases/update-journal-entry.use-case';
import { DeleteJournalEntryUseCase } from '../application/use-cases/delete-journal-entry.use-case';
import { SuggestResourcesUseCase } from '../application/use-cases/suggest-resources.use-case';
import { GetAllRelaxationResourcesUseCase } from '../application/use-cases/get-all-relaxation-resources.use-case';
import { CreateJournalEntryDto } from '../application/dto/create-journal-entry.dto';
import { UpdateJournalEntryDto } from '../application/dto/update-journal-entry.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    role: string;
  };
}

@ApiTags('Journal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('journal')
export class JournalController {
  constructor(
    private readonly createJournalEntryUseCase: CreateJournalEntryUseCase,
    private readonly getJournalEntriesUseCase: GetJournalEntriesUseCase,
    private readonly updateJournalEntryUseCase: UpdateJournalEntryUseCase,
    private readonly deleteJournalEntryUseCase: DeleteJournalEntryUseCase,
    private readonly suggestResourcesUseCase: SuggestResourcesUseCase,
    private readonly getAllRelaxationResourcesUseCase: GetAllRelaxationResourcesUseCase,
  ) {}

  @ApiOperation({ summary: 'Tạo nhật ký cá nhân mới (được phân tích AI & mã hóa)' })
  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateJournalEntryDto,
  ) {
    return this.createJournalEntryUseCase.execute(req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Lấy danh sách nhật ký cá nhân có phân trang' })
  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.getJournalEntriesUseCase.execute(req.user.userId, page, limit);
  }

  @ApiOperation({ summary: 'Lấy lịch sử nhật ký cá nhân' })
  @Get('history')
  async getHistory(
    @Req() req: AuthenticatedRequest,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.getJournalEntriesUseCase.execute(req.user.userId, page, limit);
  }

  @ApiOperation({ summary: 'Gợi ý tài nguyên thư giãn theo danh mục' })
  @ApiQuery({ name: 'category', required: false, description: 'Danh mục tài nguyên (ví dụ: breathing, calm_audio)' })
  @Get('resources')
  getResources(@Query('category') category: string) {
    return this.suggestResourcesUseCase.execute(category);
  }

  @ApiOperation({ summary: 'Lấy toàn bộ danh sách tài nguyên thư giãn' })
  @ApiQuery({ name: 'category', required: false, description: 'Danh mục tài nguyên (ví dụ: breathing, calm_audio, mindfulness)' })
  @Get('resources/all')
  getAllResources(@Query('category') category?: string) {
    return this.getAllRelaxationResourcesUseCase.execute(category);
  }

  @ApiOperation({ summary: 'Cập nhật một bài nhật ký' })
  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateJournalEntryDto,
  ) {
    return this.updateJournalEntryUseCase.execute(req.user.userId, id, dto);
  }

  @ApiOperation({ summary: 'Xóa một bài nhật ký' })
  @Delete(':id')
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.deleteJournalEntryUseCase.execute(req.user.userId, id);
  }
}
