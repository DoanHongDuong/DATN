import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyVolunteerDto {
  @ApiProperty({ description: 'Chuyên môn của tình nguyện viên' })
  @IsString()
  @IsNotEmpty({ message: 'Chuyên môn không được để trống' })
  @MaxLength(255)
  specialization: string;

  @ApiProperty({ description: 'Giới thiệu bản thân và kinh nghiệm hỗ trợ' })
  @IsString()
  @IsNotEmpty({ message: 'Giới thiệu bản thân không được để trống' })
  @MaxLength(1000)
  bio: string;

  @ApiPropertyOptional({ description: 'Đường dẫn chứng chỉ / bằng cấp chuyên môn' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  certificateUrl?: string;
}
