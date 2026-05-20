import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { ANTI_CHEAT_EVENT } from '../constants/testing.constants';

const EVENTS = Object.values(ANTI_CHEAT_EVENT);

export class AntiCheatEventDto {
  @ApiProperty({ enum: EVENTS })
  @IsIn(EVENTS)
  event!: (typeof EVENTS)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  clientSessionId?: string;
}
