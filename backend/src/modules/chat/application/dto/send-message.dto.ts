import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  @IsNotEmpty()
  sessionId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content!: string;
}
