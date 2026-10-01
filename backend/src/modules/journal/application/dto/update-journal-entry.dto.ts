import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateJournalEntryDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  moodEmoji?: string;
}
