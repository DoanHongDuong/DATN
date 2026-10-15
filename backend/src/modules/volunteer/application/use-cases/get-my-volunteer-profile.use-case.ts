import { Inject, Injectable } from '@nestjs/common';
import { VOLUNTEER_REPOSITORY, IVolunteerRepository } from '../../domain/repositories/volunteer.repository.interface';
import { VolunteerProfileEntity } from '../../domain/entities/volunteer-profile.entity';

@Injectable()
export class GetMyVolunteerProfileUseCase {
  constructor(
    @Inject(VOLUNTEER_REPOSITORY)
    private readonly volunteerRepo: IVolunteerRepository,
  ) {}

  async execute(userId: string): Promise<VolunteerProfileEntity | null> {
    return this.volunteerRepo.findByUserId(userId);
  }
}
