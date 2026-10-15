import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_REPOSITORY, IAdminRepository } from '../../domain/repositories/admin.repository.interface';
import { PendingVolunteerProfileEntity } from '../../domain/entities/admin.entity';

@Injectable()
export class GetPendingVolunteersUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepo: IAdminRepository,
  ) {}

  async execute(): Promise<PendingVolunteerProfileEntity[]> {
    return this.adminRepo.getPendingVolunteers();
  }
}
