import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import {
  AiExceptionFilter,
  AllExceptionsFilter,
  TestingExceptionFilter,
  AuthExceptionFilter,
  HttpExceptionFilter,
} from './common/filters';
import { JwtAuthGuard, RolesGuard } from './common/guards';
import { TransformInterceptor } from './common/interceptors';
import {
  appConfig,
  authConfig,
  databaseConfig,
  jwtConfig,
  learningConfig,
  openaiConfig,
  testingConfig,
  analyticsConfig,
  redisConfig,
  throttleConfig,
  loggingConfig,
  validateEnv,
} from './config';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { PrismaModule } from './prisma/prisma.module';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { CoursesModule } from './modules/courses/courses.module';
import { HealthModule } from './modules/health/health.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { StudentModule } from './modules/student/student.module';
import { TestingModule } from './modules/testing/testing.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { TeacherModule } from './modules/teacher/teacher.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [
        appConfig,
        authConfig,
        databaseConfig,
        jwtConfig,
        learningConfig,
        openaiConfig,
        testingConfig,
        analyticsConfig,
        redisConfig,
        throttleConfig,
        loggingConfig,
      ],
      envFilePath: ['.env.local', '.env'],
    }),
    InfrastructureModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    TeacherModule,
    StudentModule,
    TestingModule,
    UsersModule,
    CoursesModule,
    LessonsModule,
    AiModule,
    AnalyticsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: AuthExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: AiExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: TestingExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
