import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PracticeTaskLevel } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class UpsertPracticeTaskDto {
  @ApiProperty({ example: 'Easy practice' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 'Solve basic addition problems on the worksheet.' })
  @IsString()
  @MinLength(5)
  prompt!: string;

  @ApiPropertyOptional({ example: 'https://example.com/worksheet-a' })
  @IsOptional()
  @IsUrl()
  @MaxLength(512)
  linkUrl?: string;
}

export class UpsertPracticeTaskParamsDto {
  @ApiProperty({ enum: PracticeTaskLevel, example: PracticeTaskLevel.A })
  @IsEnum(PracticeTaskLevel)
  level!: PracticeTaskLevel;
}
