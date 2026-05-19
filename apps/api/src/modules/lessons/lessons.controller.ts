import { Controller } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('lessons')
@ApiBearerAuth()
@Controller('lessons')
export class LessonsController {}
