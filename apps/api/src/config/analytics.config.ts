import { registerAs } from '@nestjs/config';

export default registerAs('analytics', () => ({
  weakStudentScoreThreshold: parseInt(process.env.ANALYTICS_WEAK_SCORE ?? '70', 10),
  difficultTopicScoreThreshold: parseInt(process.env.ANALYTICS_DIFFICULT_TOPIC_SCORE ?? '75', 10),
  passScoreThreshold: parseInt(process.env.LEARNING_UNLOCK_SCORE ?? '85', 10),
  progressChartDays: parseInt(process.env.ANALYTICS_PROGRESS_DAYS ?? '30', 10),
  weakStudentsLimit: parseInt(process.env.ANALYTICS_WEAK_STUDENTS_LIMIT ?? '20', 10),
  difficultTopicsLimit: parseInt(process.env.ANALYTICS_DIFFICULT_TOPICS_LIMIT ?? '10', 10),
}));
