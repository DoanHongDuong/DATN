import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d).+$/, {
    message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm cả chữ và số',
  })
  password!: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword!: string;

  @IsString()
  @IsOptional()
  phone?: string;
}
