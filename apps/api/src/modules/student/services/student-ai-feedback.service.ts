import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIFeedbackType } from '@prisma/client';
import { AiService } from '@/modules/ai/services/ai.service';
import { AiRepository } from '@/modules/ai/repositories/ai.repository';
import type { AiAssessmentResponse } from '@/modules/ai/types';
import { StudentLearningRepository } from '../repositories/student-learning.repository';

@Injectable()
export class StudentAiFeedbackService {
  private readonly logger = new Logger(StudentAiFeedbackService.name);

  constructor(
    private readonly repository: StudentLearningRepository,
    private readonly aiRepository: AiRepository,
    private readonly aiService: AiService,
    private readonly config: ConfigService,
  ) {}

  async generatePostTestFeedback(
    studentId: string,
    topicId: string,
    score: number,
    passed: boolean,
    attemptId?: string,
  ) {
    const existing = await this.repository.findLatestFeedback(studentId, topicId);
    if (existing && Date.now() - existing.createdAt.getTime() < 60_000) {
      return this.mapFeedbackRecord(existing, existing.metadata as AiAssessmentResponse | null);
    }

    const threshold = this.config.get<number>('learning.unlockScoreThreshold', 85);

    let assessment: AiAssessmentResponse;

    if (attemptId && this.aiService.isEnabled()) {
      try {
        const attempt = await this.aiRepository.findTestAttempt(attemptId, studentId);
        if (attempt?.score != null) {
          const input = this.aiService.buildAnalyzeInputFromAttempt(
            attempt,
            score,
            threshold,
            passed,
          );
          assessment = await this.aiService.analyzeTest(input);
          const saved = await this.aiService.saveTestFeedback({
            studentId,
            topicId,
            assessment,
            attemptId,
          });
          return this.mapFeedbackRecord(saved, assessment);
        }
      } catch (error) {
        this.logger.warn(
          `OpenAI feedback failed, using fallback: ${(error as Error).message}`,
        );
      }
    }

    assessment = await this.buildFallbackAssessment(score, threshold, passed);
    const saved = await this.repository.createAiFeedback({
      student: { connect: { id: studentId } },
      topic: { connect: { id: topicId } },
      type: passed ? AIFeedbackType.ENCOURAGEMENT : AIFeedbackType.HINT,
      content: [assessment.feedback, assessment.recommendation, assessment.socraticHint].join(
        '\n\n',
      ),
      metadata: { ...assessment, generatedBy: 'fallback' },
    });

    return this.mapFeedbackRecord(saved, assessment);
  }

  private async buildFallbackAssessment(
    score: number,
    threshold: number,
    passed: boolean,
  ): Promise<AiAssessmentResponse> {
    const level =
      score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'medium' : 'weak';

    return {
      score,
      level: level as AiAssessmentResponse['level'],
      feedback: passed
        ? `Great job! You scored ${score}%.`
        : `You scored ${score}%. Keep learning — you can try again!`,
      recommendation: passed
        ? 'You can open the next topic.'
        : `Review the material and aim for ${threshold}% on the test.`,
      allowNextTopic: passed,
      socraticHint: passed
        ? 'What was the most interesting thing you learned?'
        : 'Which question felt hardest for you?',
    };
  }

  private mapFeedbackRecord(
    record: {
      id: string;
      type: string;
      content: string;
      metadata: unknown;
      createdAt: Date;
    },
    assessment: AiAssessmentResponse | null,
  ) {
    const meta = (record.metadata ?? assessment) as AiAssessmentResponse | null;
    return {
      id: record.id,
      type: record.type,
      content: record.content,
      createdAt: record.createdAt,
      assessment: meta ?? assessment,
    };
  }
}
