import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ADMIN_REPOSITORY, IAdminRepository } from '../../domain/repositories/admin.repository.interface';

@Injectable()
export class DeleteResourceUseCase {
  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepo: IAdminRepository,
  ) {}

  async execute(actorId: string, id: string): Promise<void> {
    const existing = await this.adminRepo.findResourceById(id);
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy tài nguyên thư giãn với ID: ${id}`);
    }

    await this.adminRepo.deleteResource(actorId, id);
  }
}
