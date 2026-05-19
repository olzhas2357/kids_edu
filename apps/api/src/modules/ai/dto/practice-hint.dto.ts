import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { MAX_STUDENT_MESSAGE_LENGTH } from '../constants/ai.constants';

export class PracticeHintDto {
  @ApiPropertyOptional({ description: 'Student question or reflection' })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_STUDENT_MESSAGE_LENGTH)
  message?: string;

  @ApiPropertyOptional({ description: 'Chat session id for continuity' })
  @IsOptional()
  @IsUUID()
  sessionId?: string;
}

export class AiChatDto {
  @ApiProperty({ description: 'Student message' })
  @IsString()
  @MaxLength(MAX_STUDENT_MESSAGE_LENGTH)
  message!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  topicId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sessionId?: string;
}
