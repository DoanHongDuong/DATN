import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateJournalEntryDto {
  @ApiPropertyOptional({ description: 'Nội dung nhật ký cập nhật', example: 'Hôm nay tôi thấy khá hơn' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({ description: 'Emoji biểu thị tâm trạng cập nhật', example: '😄' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  moodEmoji?: string;
}
