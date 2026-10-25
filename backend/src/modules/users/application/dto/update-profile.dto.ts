import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A', description: 'Họ và tên (2-100 ký tự)' })
  @IsOptional()
  @IsString()
  @Length(2, 100, { message: 'Họ và tên phải từ 2 đến 100 ký tự' })
  fullName?: string;

  @ApiPropertyOptional({ example: '0912345678', description: 'Số điện thoại Việt Nam' })
  @IsOptional()
  @IsString()
  @Matches(/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, {
    message: 'Số điện thoại không đúng định dạng số Việt Nam (VD: 0912345678 hoặc +84912345678)',
  })
  phone?: string;
}
