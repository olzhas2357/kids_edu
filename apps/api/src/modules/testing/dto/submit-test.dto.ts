import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class SubmitTestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientSessionId?: string;

  @ApiPropertyOptional({ description: 'Client reports timer expiry' })
  @IsOptional()
  @IsBoolean()
  timedOut?: boolean;
}
