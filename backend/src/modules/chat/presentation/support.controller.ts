import { Controller, Get, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private readonly configService: ConfigService) {}

  @Get('emergency')
  @ApiOperation({ summary: 'Lấy số hotline khẩn cấp công khai (không yêu cầu JWT)' })
  @ApiResponse({ status: 200, description: 'Số điện thoại hotline khẩn cấp' })
  @ApiResponse({ status: 404, description: 'Hotline khẩn cấp chưa được cấu hình' })
  getEmergencyHotline(): { hotline: string } {
    const hotline = this.configService.get<string>('EMERGENCY_HOTLINE');
    if (!hotline || !hotline.trim()) {
      throw new NotFoundException('Hotline khẩn cấp chưa được cấu hình');
    }
    return { hotline: hotline.trim() };
  }
}

