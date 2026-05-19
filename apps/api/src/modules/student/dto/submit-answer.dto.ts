import { ApiProperty } from '@nestjs/swagger';

export class SubmitAnswerDto {
  @ApiProperty({ description: 'Answer value (string, boolean, or string[])' })
  answer!: string | boolean | string[];
}
