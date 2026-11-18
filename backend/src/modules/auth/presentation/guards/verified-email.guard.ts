import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject } from '@nestjs/common';
import { USER_REPOSITORY, IUserRepository } from '../../domain/repositories/user.repository.interface';

@Injectable()
export class VerifiedEmailGuard implements CanActivate {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: { userId?: string } }>();
    const userId = request.user?.userId;

    if (!userId) {
      return false;
    }

    const user = await this.userRepository.findById(userId);
    if (!user || !user.emailVerified) {
      throw new ForbiddenException(
        'Tính năng này yêu cầu tài khoản đã xác thực email để đảm bảo an toàn. Vui lòng xác thực email của bạn.',
      );
    }

    return true;
  }
}
