import { Module, forwardRef } from '@nestjs/common';
import { AiModule } from '@/modules/ai/ai.module';
import { StudentModule } from '@/modules/student/student.module';
import { TestingController } from './controllers/testing.controller';
import { TestingRepository } from './repositories/testing.repository';
import { TestAntiCheatService } from './services/test-anticheat.service';
import { TestAutosaveService } from './services/test-autosave.service';
import { TestEngineService } from './services/test-engine.service';
import { TestHistoryService } from './services/test-history.service';
import { TestScoringService } from './services/test-scoring.service';
import { TestTimerService } from './services/test-timer.service';

@Module({
  imports: [AiModule, forwardRef(() => StudentModule)],
  controllers: [TestingController],
  providers: [
    TestingRepository,
    TestEngineService,
    TestScoringService,
    TestTimerService,
    TestAntiCheatService,
    TestAutosaveService,
    TestHistoryService,
  ],
  exports: [TestEngineService],
})
export class TestingModule {}
