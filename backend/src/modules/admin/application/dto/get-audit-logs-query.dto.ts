import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetAuditLogsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Lọc theo hành động (VD: APPROVE_VOLUNTEER, REJECT_VOLUNTEER, LOCK_USER...)' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'Lọc từ ngày (định dạng ISO, ví dụ: 2026-10-01 hoặc 2026-10-01T00:00:00.000Z)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Lọc đến ngày (định dạng ISO, ví dụ: 2026-10-18 hoặc 2026-10-18T23:59:59.999Z)' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
