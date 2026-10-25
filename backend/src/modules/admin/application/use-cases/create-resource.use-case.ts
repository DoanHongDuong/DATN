import { Inject, Injectable } from '@nestjs/common';
import { ADMIN_REPOSITORY, IAdminRepository } from '../../domain/repositories/admin.repository.interface';
import { AdminRelaxationResourceEntity } from '../../domain/entities/admin.entity';
import { CreateResourceDto } from '../dto/create-resource.dto';

@Injectable()
export class CreateResourceUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepo: IAdminRepository,
  ) {}

  async execute(actorId: string, dto: CreateResourceDto): Promise<AdminRelaxationResourceEntity> {
    return this.adminRepo.createResource(actorId, {
      title: dto.title.trim(),
      type: dto.type.trim(),
      url: dto.url.trim(),
      durationSeconds: dto.durationSeconds ?? null,
      category: dto.category.trim(),
    });
  }
}
