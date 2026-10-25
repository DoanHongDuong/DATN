import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  IUserProfileRepository,
  UpdateUserProfileData,
} from '../../domain/repositories/user-profile.repository.interface';
import { UserProfileEntity } from '../../domain/entities/user-profile.entity';

@Injectable()
export class UserProfilePrismaRepository implements IUserProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserProfileEntity | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, data: UpdateUserProfileData): Promise<UserProfileEntity> {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
