import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  USER_REPOSITORY,
  IUserRepository,
} from '../../domain/repositories/user.repository.interface';
import { ChangePasswordDto } from '../dto/change-password.dto';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('Mật khẩu xác nhận không khớp');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng');
    }

    // 1. Kiểm tra mật khẩu hiện tại bằng bcrypt.compare
    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isCurrentPasswordValid) {
      // Sai mật khẩu hiện tại trả 400 với message chung
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    // 2. Mật khẩu mới phải khác mật khẩu cũ
    const isSameAsOld = await bcrypt.compare(dto.newPassword, user.passwordHash);
    if (isSameAsOld) {
      throw new BadRequestException('Mật khẩu mới không được trùng với mật khẩu hiện tại');
    }

    // 3. Hash bcrypt 10 rounds
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.newPassword, saltRounds);

    // 4. Cập nhật mật khẩu trong DB (Tuyệt đối không log mật khẩu)
    await this.userRepository.update(userId, { passwordHash });

    return { message: 'Đổi mật khẩu thành công' };
  }
}
