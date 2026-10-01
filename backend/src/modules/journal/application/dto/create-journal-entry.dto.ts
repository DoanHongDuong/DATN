import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateJournalEntryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  moodEmoji?: string;
}
