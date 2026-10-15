import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJournalEntryDto {
  @ApiProperty({ description: 'Nội dung nhật ký', example: 'Hôm nay là một ngày tuyệt vời' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content!: string;

  @ApiPropertyOptional({ description: 'Emoji biểu thị tâm trạng', example: '😊' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  moodEmoji?: string;
}
