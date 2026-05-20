import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { Public } from '@/common/decorators';
import { HealthService } from './health.service';

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Get()
  check() {
    return this.healthService.live();
  }

  @Public()
  @Get('live')
  live() {
    return this.healthService.live();
  }

  @Public()
  @Get('ready')
  async ready() {
    return this.healthService.ready();
  }

  @Public()
  @Get('metrics')
  metrics() {
    if (!this.config.get<boolean>('app.metricsEnabled', false)) {
      return { enabled: false };
    }
    return this.healthService.metrics();
  }
}
