import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'Họ và tên người dùng', example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ description: 'Email đăng ký', example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'Mật khẩu (tối thiểu 8 ký tự, gồm cả chữ và số)', example: 'Password123' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải bao gồm cả chữ cái và chữ số',
  })
  password!: string;

  @ApiProperty({ description: 'Xác nhận mật khẩu', example: 'Password123' })
  @IsString()
  @IsNotEmpty()
  confirmPassword!: string;

  @ApiPropertyOptional({ description: 'Số điện thoại liên hệ', example: '0912345678' })
  @IsString()
  @IsOptional()
  phone?: string;
}
