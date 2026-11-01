import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVolunteerProfileDto {
  @ApiPropertyOptional({ description: 'Chuyên môn của tình nguyện viên' })
  @IsOptional()
  @IsString({ message: 'Chuyên môn phải là chuỗi ký tự' })
  @MaxLength(255, { message: 'Chuyên môn tối đa 255 ký tự' })
  specialization?: string;

  @ApiPropertyOptional({ description: 'Giới thiệu bản thân và kinh nghiệm hỗ trợ' })
  @IsOptional()
  @IsString({ message: 'Giới thiệu bản thân phải là chuỗi ký tự' })
  @MaxLength(1000, { message: 'Giới thiệu bản thân tối đa 1000 ký tự' })
  bio?: string;

  @ApiPropertyOptional({ description: 'Đường dẫn chứng chỉ / bằng cấp chuyên môn' })
  @IsOptional()
  @IsString({ message: 'Đường dẫn chứng chỉ phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Đường dẫn chứng chỉ tối đa 500 ký tự' })
  certificateUrl?: string;
}

