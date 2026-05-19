import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class AnalyzeTestDto {
  @ApiPropertyOptional({ description: 'Test attempt to analyze (loads answers from DB)' })
  @IsOptional()
  @IsUUID()
  attemptId?: string;
}
