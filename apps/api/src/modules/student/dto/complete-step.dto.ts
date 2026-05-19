import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class CompleteVideoDto {
  @ApiPropertyOptional({ description: 'Watched seconds for analytics' })
  @IsOptional()
  @IsInt()
  @Min(0)
  watchedSeconds?: number;
}
