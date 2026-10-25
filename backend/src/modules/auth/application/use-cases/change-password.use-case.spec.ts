import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ChangePasswordUseCase } from './change-password.use-case';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    useCase = new ChangePasswordUseCase(userRepository);
  });

  it('should change password successfully when all inputs are valid', async () => {
    const oldPasswordHash = await bcrypt.hash('OldPassword123', 10);
    userRepository.findById.mockResolvedValue({
      id: 'user-1',
      passwordHash: oldPasswordHash,
    } as any);

    userRepository.update.mockResolvedValue({} as any);

    const result = await useCase.execute('user-1', {
      currentPassword: 'OldPassword123',
      newPassword: 'NewPassword456',
      confirmNewPassword: 'NewPassword456',
    });

    expect(result).toEqual({ message: 'Đổi mật khẩu thành công' });
    expect(userRepository.update).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        passwordHash: expect.any(String),
      }),
    );
  });

  it('should throw BadRequestException if confirm password does not match', async () => {
    await expect(
      useCase.execute('user-1', {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword456',
        confirmNewPassword: 'DifferentPassword456',
      }),
    ).rejects.toThrow(new BadRequestException('Mật khẩu xác nhận không khớp'));
  });

  it('should throw BadRequestException if current password is wrong', async () => {
    const oldPasswordHash = await bcrypt.hash('OldPassword123', 10);
    userRepository.findById.mockResolvedValue({
      id: 'user-1',
      passwordHash: oldPasswordHash,
    } as any);

    await expect(
      useCase.execute('user-1', {
        currentPassword: 'WrongPassword123',
        newPassword: 'NewPassword456',
        confirmNewPassword: 'NewPassword456',
      }),
    ).rejects.toThrow(new BadRequestException('Mật khẩu hiện tại không chính xác'));
  });

  it('should throw BadRequestException if new password is same as old password', async () => {
    const oldPasswordHash = await bcrypt.hash('OldPassword123', 10);
    userRepository.findById.mockResolvedValue({
      id: 'user-1',
      passwordHash: oldPasswordHash,
    } as any);

    await expect(
      useCase.execute('user-1', {
        currentPassword: 'OldPassword123',
        newPassword: 'OldPassword123',
        confirmNewPassword: 'OldPassword123',
      }),
    ).rejects.toThrow(new BadRequestException('Mật khẩu mới không được trùng với mật khẩu hiện tại'));
  });
});
