import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RejectVolunteerDto {
  @ApiPropertyOptional({ description: 'Lý do từ chối hồ sơ tình nguyện viên', example: 'Chứng chỉ sơ cứu tâm lý chưa hợp lệ' })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Lý do từ chối không được vượt quá 500 ký tự' })
  reason?: string;
}
