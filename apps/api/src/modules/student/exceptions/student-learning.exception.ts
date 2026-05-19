import { HttpException, HttpStatus } from '@nestjs/common';

export class StudentNotFoundException extends HttpException {
  constructor(resource: string) {
    super(`${resource} not found`, HttpStatus.NOT_FOUND);
  }
}

export class StudentTopicLockedException extends HttpException {
  constructor() {
    super(
      {
        message: 'This topic is locked. Complete the previous topic with score >= 85% to unlock.',
        code: 'TOPIC_LOCKED',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

export class StudentStepOrderException extends HttpException {
  constructor(requiredStep: string) {
    super(
      {
        message: `Complete the previous step first: ${requiredStep}`,
        code: 'STEP_ORDER_VIOLATION',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class StudentLearningConflictException extends HttpException {
  constructor(message: string) {
    super({ message, code: 'LEARNING_CONFLICT' }, HttpStatus.CONFLICT);
  }
}
