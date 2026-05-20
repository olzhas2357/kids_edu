import { Module } from '@nestjs/common';
import { TeacherModule } from '@/modules/teacher/teacher.module';
import { AnalyticsController } from './controllers/analytics.controller';
import { AnalyticsRepository } from './repositories/analytics.repository';
import { AnalyticsAiRiskService } from './services/analytics-ai-risk.service';
import { AnalyticsStatisticsService } from './services/analytics-statistics.service';

@Module({
  imports: [TeacherModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsRepository, AnalyticsStatisticsService, AnalyticsAiRiskService],
  exports: [AnalyticsStatisticsService],
})
export class AnalyticsModule {}
