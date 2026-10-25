import { Inject, Injectable } from '@nestjs/common';
import {
  ADMIN_REPOSITORY,
  IAdminRepository,
} from '../../domain/repositories/admin.repository.interface';
import { PaginatedAuditLogsResult } from '../../domain/entities/admin.entity';
import { GetAuditLogsQueryDto } from '../dto/get-audit-logs-query.dto';

@Injectable()
export class GetAuditLogsUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepo: IAdminRepository,
  ) {}

  async execute(query: GetAuditLogsQueryDto): Promise<PaginatedAuditLogsResult> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;

    return this.adminRepo.getAuditLogs({
      page,
      limit,
      action: query.action?.trim() || undefined,
      from: query.from?.trim() || undefined,
      to: query.to?.trim() || undefined,
    });
  }
}
