import { Module } from '@nestjs/common';
import { AiModule } from '@/modules/ai/ai.module';
import { StudentCoursesController } from './controllers/student-courses.controller';
import { StudentLearningController } from './controllers/student-learning.controller';
import { StudentTopicAccessGuard } from './guards/student-topic-access.guard';
import { StudentLearningRepository } from './repositories/student-learning.repository';
import { StudentAiFeedbackService } from './services/student-ai-feedback.service';
import { StudentLearningService } from './services/student-learning.service';
import { StudentProgressService } from './services/student-progress.service';
import { StudentScoringService } from './services/student-scoring.service';
import { StudentTestService } from './services/student-test.service';

@Module({
  imports: [AiModule],
  controllers: [StudentCoursesController, StudentLearningController],
  providers: [
    StudentLearningRepository,
    StudentProgressService,
    StudentScoringService,
    StudentTestService,
    StudentAiFeedbackService,
    StudentLearningService,
    StudentTopicAccessGuard,
  ],
  exports: [StudentLearningService, StudentProgressService],
})
export class StudentModule {}
