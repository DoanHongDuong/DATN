import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_REPOSITORY, IAdminRepository } from '../../domain/repositories/admin.repository.interface';
import { PaginatedUsersResult } from '../../domain/entities/admin.entity';
import { GetUsersQueryDto } from '../dto/get-users-query.dto';

@Injectable()
export class GetUsersUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepo: IAdminRepository,
  ) {}

  async execute(query: GetUsersQueryDto): Promise<PaginatedUsersResult> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    return this.adminRepo.getUsers(page, limit, query.search?.trim());
  }
}
