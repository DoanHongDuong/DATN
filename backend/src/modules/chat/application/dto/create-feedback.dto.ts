import { IsInt, Min, Max, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeedbackDto {
  @ApiProperty({ description: 'Đánh giá số sao từ 1 đến 5', minimum: 1, maximum: 5 })
  @IsInt({ message: 'Số sao đánh giá phải là số nguyên' })
  @Min(1, { message: 'Đánh giá tối thiểu là 1 sao' })
  @Max(5, { message: 'Đánh giá tối đa là 5 sao' })
  rating: number;

  @ApiPropertyOptional({ description: 'Nhận xét hoặc góp ý về phiên hỗ trợ' })
  @IsOptional()
  @IsString({ message: 'Nhận xét phải là chuỗi ký tự' })
  @MaxLength(1000, { message: 'Nhận xét tối đa 1000 ký tự' })
  comment?: string;
}

