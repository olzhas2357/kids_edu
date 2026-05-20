import { Module, forwardRef } from '@nestjs/common';
import { AiModule } from '@/modules/ai/ai.module';
import { TestingModule } from '@/modules/testing/testing.module';
import { StudentCoursesController } from './controllers/student-courses.controller';
import { StudentLearningController } from './controllers/student-learning.controller';
import { StudentTopicAccessGuard } from './guards/student-topic-access.guard';
import { StudentLearningRepository } from './repositories/student-learning.repository';
import { StudentAiFeedbackService } from './services/student-ai-feedback.service';
import { StudentLearningService } from './services/student-learning.service';
import { StudentProgressService } from './services/student-progress.service';
import { StudentScoringService } from './services/student-scoring.service';

@Module({
  imports: [AiModule, forwardRef(() => TestingModule)],
  controllers: [StudentCoursesController, StudentLearningController],
  providers: [
    StudentLearningRepository,
    StudentProgressService,
    StudentScoringService,
    StudentAiFeedbackService,
    StudentLearningService,
    StudentTopicAccessGuard,
  ],
  exports: [
    StudentLearningService,
    StudentProgressService,
    StudentScoringService,
    StudentTopicAccessGuard,
  ],
})
export class StudentModule {}
