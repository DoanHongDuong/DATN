import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOnlineStatusDto {
  @ApiProperty({ description: 'Trạng thái sẵn sàng nhận phiên tư vấn' })
  @IsBoolean({ message: 'Trạng thái trực tuyến phải là kiểu boolean' })
  @IsNotEmpty({ message: 'Trạng thái trực tuyến không được để trống' })
  isOnline: boolean;
}
