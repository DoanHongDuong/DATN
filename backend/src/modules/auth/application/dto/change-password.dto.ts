import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Mật khẩu hiện tại', example: 'OldPassword123' })
  @IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'Mật khẩu mới (tối thiểu 8 ký tự, có cả chữ và số)', example: 'NewPassword123' })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu mới phải có tối thiểu 8 ký tự' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'Mật khẩu mới phải bao gồm cả chữ cái và chữ số',
  })
  newPassword: string;

  @ApiProperty({ description: 'Xác nhận mật khẩu mới', example: 'NewPassword123' })
  @IsNotEmpty({ message: 'Xác nhận mật khẩu mới không được để trống' })
  @IsString()
  confirmNewPassword: string;
}
