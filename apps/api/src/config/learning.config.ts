import { registerAs } from '@nestjs/config';

export default registerAs('learning', () => ({
  unlockScoreThreshold: parseInt(process.env.LEARNING_UNLOCK_SCORE ?? '85', 10),
  stepWeights: {
    theory: 15,
    video: 15,
    practiceA: 15,
    practiceB: 15,
    practiceC: 15,
    test: 25,
  },
}));
