import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class SaveAnswerDto {
  @ApiProperty({ description: 'Selected option value(s) from the 4 choices' })
  answer!: string | string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientSessionId?: string;
}

export class AutosaveAnswersDto {
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  answers!: Array<{ questionId: string; answer: string | string[] }>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientSessionId?: string;
}
