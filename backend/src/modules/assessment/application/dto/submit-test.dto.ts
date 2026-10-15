import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AnswerDto {
  @ApiProperty({ description: 'ID của câu hỏi', example: 'q1' })
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @ApiProperty({ description: 'ID của lựa chọn đáp án', example: 'opt1' })
  @IsString()
  @IsNotEmpty()
  optionId!: string;
}

export class SubmitTestDto {
  @ApiProperty({ type: [AnswerDto], description: 'Danh sách đáp án người dùng trả lời' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers!: AnswerDto[];
}
