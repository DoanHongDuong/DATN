import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateResourceDto {
  @ApiProperty({ description: 'Tiêu đề tài nguyên thư giãn', example: 'Kỹ thuật thở sâu 4-7-8' })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString({ message: 'Tiêu đề phải là chuỗi ký tự' })
  title: string;

  @ApiProperty({ description: 'Loại tài nguyên (audio, video, exercise, article)', example: 'exercise' })
  @IsNotEmpty({ message: 'Loại tài nguyên không được để trống' })
  @IsString({ message: 'Loại tài nguyên phải là chuỗi ký tự' })
  type: string;

  @ApiProperty({ description: 'Đường dẫn liên kết / URL của tài nguyên', example: 'https://example.com/breathing-audio.mp3' })
  @IsNotEmpty({ message: 'Đường dẫn không được để trống' })
  @IsString({ message: 'Đường dẫn phải là chuỗi ký tự' })
  url: string;

  @ApiPropertyOptional({ description: 'Thời lượng tính bằng giây', example: 300 })
  @IsOptional()
  @IsInt({ message: 'Thời lượng phải là số nguyên' })
  @Min(0, { message: 'Thời lượng không được nhỏ hơn 0' })
  durationSeconds?: number;

  @ApiProperty({ description: 'Danh mục tài nguyên (breathing, meditation, music, mindfulness)', example: 'breathing' })
  @IsNotEmpty({ message: 'Danh mục không được để trống' })
  @IsString({ message: 'Danh mục phải là chuỗi ký tự' })
  category: string;
}
