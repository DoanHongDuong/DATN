import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ description: 'ID của phiên chat', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  sessionId!: string;

  @ApiProperty({ description: 'Nội dung tin nhắn', example: 'Xin chào, tôi cần tư vấn tâm lý' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content!: string;
}
