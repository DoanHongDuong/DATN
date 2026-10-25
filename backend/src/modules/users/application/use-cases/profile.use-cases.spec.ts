import { NotFoundException } from '@nestjs/common';
import { GetProfileUseCase } from './get-profile.use-case';
import { UpdateProfileUseCase } from './update-profile.use-case';
import { IUserProfileRepository } from '../../domain/repositories/user-profile.repository.interface';

describe('User Profile Use Cases', () => {
  let repository: jest.Mocked<IUserProfileRepository>;
  let getProfileUseCase: GetProfileUseCase;
  let updateProfileUseCase: UpdateProfileUseCase;

  const mockUser = {
    id: 'user-123',
    fullName: 'Nguyễn Văn A',
    email: 'nguyenvana@gmail.com',
    phone: '0912345678',
    role: 'USER',
    createdAt: new Date('2026-01-01'),
  };

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      update: jest.fn(),
    };
    getProfileUseCase = new GetProfileUseCase(repository);
    updateProfileUseCase = new UpdateProfileUseCase(repository);
  });

  describe('GetProfileUseCase', () => {
    it('should return user profile if found', async () => {
      repository.findById.mockResolvedValue(mockUser);

      const result = await getProfileUseCase.execute('user-123');
      expect(result).toEqual(mockUser);
      expect(repository.findById).toHaveBeenCalledWith('user-123');
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(getProfileUseCase.execute('not-found')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('UpdateProfileUseCase', () => {
    it('should update and return updated user profile', async () => {
      repository.findById.mockResolvedValue(mockUser);
      repository.update.mockResolvedValue({
        ...mockUser,
        fullName: 'Nguyễn Văn B',
        phone: '0987654321',
      });

      const result = await updateProfileUseCase.execute('user-123', {
        fullName: '  Nguyễn Văn B  ',
        phone: '0987654321',
      });

      expect(repository.update).toHaveBeenCalledWith('user-123', {
        fullName: 'Nguyễn Văn B',
        phone: '0987654321',
      });
      expect(result.fullName).toBe('Nguyễn Văn B');
    });

    it('should throw NotFoundException if user to update does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        updateProfileUseCase.execute('not-found', { fullName: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
