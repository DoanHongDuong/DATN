import { Injectable, Inject } from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  CHAT_REPOSITORY,
  IChatRepository,
} from '../../domain/repositories/chat.repository.interface';

@Injectable()
export class GetMyActiveSessionUseCase {
  constructor(
    @Inject(CHAT_REPOSITORY)
    private readonly chatRepository: IChatRepository,
  ) {}

  async execute(userId: string, role: string) {
    if (role === Role.VOLUNTEER) {
      return this.chatRepository.findActiveSessionByVolunteerId(userId);
    }
    return this.chatRepository.findActiveOrWaitingSessionByUserId(userId);
  }
}
