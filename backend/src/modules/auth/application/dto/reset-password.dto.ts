import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Email tài khoản' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'Token reset từ email' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ description: 'Mật khẩu mới (tối thiểu 8 ký tự, gồm cả chữ và số)' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải bao gồm cả chữ cái và chữ số',
  })
  newPassword!: string;

  @ApiProperty({ description: 'Xác nhận mật khẩu mới' })
  @IsString()
  @IsNotEmpty()
  confirmNewPassword!: string;
}
