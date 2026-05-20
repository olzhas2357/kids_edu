import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser, Roles } from '@/common/decorators';
import type { AuthUser } from '@/common/types';
import { TeacherCourseGuard } from '@/modules/teacher/guards/teacher-course.guard';
import { AnalyticsQueryDto } from '../dto';
import { AnalyticsStatisticsService } from '../services/analytics-statistics.service';

@ApiTags('teacher-analytics')
@ApiBearerAuth()
@Roles(Role.TEACHER, Role.ADMIN)
@Controller('teacher/courses/:courseId/analytics')
@UseGuards(TeacherCourseGuard)
export class AnalyticsController {
  constructor(private readonly statistics: AnalyticsStatisticsService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Full analytics dashboard — scores, topics, students, charts, AI risk',
  })
  getDashboard(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.statistics.getDashboard(courseId, user, query.days);
  }

  @Get('summary')
  @ApiOperation({ summary: 'KPI summary — average score, pass rate, attempts' })
  getSummary(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.statistics.getSummaryOnly(courseId, user);
  }

  @Get('topics/difficult')
  @ApiOperation({ summary: 'Hardest topics by average score and fail rate' })
  getDifficultTopics(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.statistics.getDifficultTopics(courseId, user);
  }

  @Get('students/weak')
  @ApiOperation({ summary: 'Students needing support' })
  getWeakStudents(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.statistics.getWeakStudents(courseId, user);
  }

  @Get('charts/progress')
  @ApiOperation({ summary: 'Chart-ready progress data (labels + datasets)' })
  getProgressChart(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.statistics.getProgressChart(courseId, user, query.days);
  }

  @Get('charts/attempts')
  @ApiOperation({ summary: 'Chart-ready attempts + status breakdown' })
  getAttemptsChart(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query() query: AnalyticsQueryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.statistics.getAttemptsChart(courseId, user, query.days);
  }

  @Get('ai-risk')
  @ApiOperation({ summary: 'AI-assisted risk analysis (cheating + weak performance)' })
  getAiRisk(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.statistics.getAiRisk(courseId, user);
  }
}
