import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class StartTestDto {
  @ApiPropertyOptional({ description: 'Client session UUID for anti-cheat binding' })
  @IsOptional()
  @IsUUID()
  clientSessionId?: string;
}
