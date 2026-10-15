import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import { IVolunteerRepository, CreateVolunteerProfileData } from '../../domain/repositories/volunteer.repository.interface';
import { VolunteerProfileEntity } from '../../domain/entities/volunteer-profile.entity';

@Injectable()
export class VolunteerPrismaRepository implements IVolunteerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<VolunteerProfileEntity | null> {
    return this.prisma.volunteerProfile.findUnique({
      where: { userId },
    });
  }

  async create(data: CreateVolunteerProfileData): Promise<VolunteerProfileEntity> {
    return this.prisma.volunteerProfile.create({
      data: {
        userId: data.userId,
        specialization: data.specialization ?? null,
        bio: data.bio ?? null,
        certificateUrl: data.certificateUrl ?? null,
        isVerified: false,
        isOnline: false,
      },
    });
  }

  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<VolunteerProfileEntity> {
    return this.prisma.volunteerProfile.update({
      where: { userId },
      data: { isOnline },
    });
  }
}
