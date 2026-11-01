import { Inject, Injectable } from '@nestjs/common';
import {
  ADMIN_REPOSITORY,
  IAdminRepository,
} from '../../domain/repositories/admin.repository.interface';
import { SystemStatsEntity } from '../../domain/entities/admin.entity';

@Injectable()
export class GetSystemStatsUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepository: IAdminRepository,
  ) {}

  async execute(): Promise<SystemStatsEntity> {
    return this.adminRepository.getSystemStats();
  }
}

