import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateTestQuestionDto {
  @ApiProperty()
  @IsString()
  questionText!: string;

  @ApiProperty({ enum: QuestionType })
  @IsEnum(QuestionType)
  type!: QuestionType;

  @ApiPropertyOptional({ type: 'array', items: { type: 'string' } })
  @IsOptional()
  options?: string[];

  @ApiProperty({ description: 'Correct answer (string, boolean, or array for multiple choice)' })
  correctAnswer!: string | boolean | string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}

export class UpdateTestQuestionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  questionText?: string;

  @ApiPropertyOptional({ enum: QuestionType })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiPropertyOptional()
  @IsOptional()
  options?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  correctAnswer?: string | boolean | string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  explanation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;
}
