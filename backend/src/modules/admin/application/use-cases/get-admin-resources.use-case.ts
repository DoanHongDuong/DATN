import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_REPOSITORY, IAdminRepository } from '../../domain/repositories/admin.repository.interface';
import { AdminRelaxationResourceEntity } from '../../domain/entities/admin.entity';

@Injectable()
export class GetAdminResourcesUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepo: IAdminRepository,
  ) {}

  async execute(category?: string): Promise<AdminRelaxationResourceEntity[]> {
    return this.adminRepo.getAllResources(category?.trim());
  }
}
