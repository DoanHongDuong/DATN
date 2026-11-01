import { NotFoundException } from '@nestjs/common';
import { UpdateVolunteerProfileUseCase } from './update-volunteer-profile.use-case';
import { IVolunteerRepository } from '../../domain/repositories/volunteer.repository.interface';
import { VolunteerProfileEntity } from '../../domain/entities/volunteer-profile.entity';

describe('UpdateVolunteerProfileUseCase', () => {
  let useCase: UpdateVolunteerProfileUseCase;
  let volunteerRepo: jest.Mocked<IVolunteerRepository>;

  const baseProfile: VolunteerProfileEntity = {
    id: 'profile-1',
    userId: 'user-1',
    specialization: 'Tâm lý học đường',
    bio: 'Giới thiệu ban đầu',
    certificateUrl: 'https://example.com/cert.pdf',
    isVerified: true,
    isOnline: true,
    createdAt: new Date(),
  };

  beforeEach(() => {
    volunteerRepo = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      updateOnlineStatus: jest.fn(),
      updateProfile: jest.fn(),
    };

    useCase = new UpdateVolunteerProfileUseCase(volunteerRepo);
  });

  it('should throw NotFoundException if profile does not exist', async () => {
    volunteerRepo.findByUserId.mockResolvedValue(null);

    await expect(
      useCase.execute('user-1', { specialization: 'Tâm lý học' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should not require reverification if only bio is changed', async () => {
    volunteerRepo.findByUserId.mockResolvedValue({ ...baseProfile });
    const updated = { ...baseProfile, bio: 'Giới thiệu mới' };
    volunteerRepo.updateProfile.mockResolvedValue(updated);

    const result = await useCase.execute('user-1', {
      bio: '  Giới thiệu mới  ',
    });

    expect(volunteerRepo.updateProfile).toHaveBeenCalledWith('user-1', {
      specialization: undefined,
      bio: 'Giới thiệu mới',
      certificateUrl: undefined,
    });
    expect(result.requiresReverification).toBe(false);
    expect(result.profile.isVerified).toBe(true);
  });

  it('should require reverification and set isVerified=false and isOnline=false if specialization or certificate changes', async () => {
    volunteerRepo.findByUserId.mockResolvedValue({ ...baseProfile });
    const updated = {
      ...baseProfile,
      specialization: 'Chuyên gia Tham vấn',
      isVerified: false,
      isOnline: false,
    };
    volunteerRepo.updateProfile.mockResolvedValue(updated);

    const result = await useCase.execute('user-1', {
      specialization: '  Chuyên gia Tham vấn  ',
    });

    expect(volunteerRepo.updateProfile).toHaveBeenCalledWith('user-1', {
      specialization: 'Chuyên gia Tham vấn',
      bio: undefined,
      certificateUrl: undefined,
      isVerified: false,
      isOnline: false,
    });
    expect(result.requiresReverification).toBe(true);
    expect(result.profile.isVerified).toBe(false);
    expect(result.profile.isOnline).toBe(false);
  });
});
