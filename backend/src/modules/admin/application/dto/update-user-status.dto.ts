import { IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserStatusDto {
  @ApiProperty({ description: 'Trạng thái tài khoản', enum: ['ACTIVE', 'SUSPENDED'] })
  @IsNotEmpty({ message: 'Trạng thái không được để trống' })
  @IsIn(['ACTIVE', 'SUSPENDED'], { message: 'Trạng thái phải là ACTIVE hoặc SUSPENDED' })
  status: 'ACTIVE' | 'SUSPENDED';
}
