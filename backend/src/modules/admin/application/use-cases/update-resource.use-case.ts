import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ADMIN_REPOSITORY, IAdminRepository } from '../../domain/repositories/admin.repository.interface';
import { AdminRelaxationResourceEntity } from '../../domain/entities/admin.entity';
import { UpdateResourceDto } from '../dto/update-resource.dto';

@Injectable()
export class UpdateResourceUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepo: IAdminRepository,
  ) {}

  async execute(
    actorId: string,
    id: string,
    dto: UpdateResourceDto,
  ): Promise<AdminRelaxationResourceEntity> {
    const existing = await this.adminRepo.findResourceById(id);
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy tài nguyên thư giãn với ID: ${id}`);
    }

    return this.adminRepo.updateResource(actorId, id, {
      title: dto.title?.trim(),
      type: dto.type?.trim(),
      url: dto.url?.trim(),
      durationSeconds: dto.durationSeconds !== undefined ? dto.durationSeconds : undefined,
      category: dto.category?.trim(),
    });
  }
}
