import { HttpException, HttpStatus } from '@nestjs/common';

export type TestingErrorCode =
  | 'TEST_NOT_CONFIGURED'
  | 'TEST_INVALID_FORMAT'
  | 'MAX_ATTEMPTS_REACHED'
  | 'ATTEMPT_EXPIRED'
  | 'ATTEMPT_NOT_ACTIVE'
  | 'ATTEMPT_NOT_FOUND'
  | 'QUESTION_NOT_FOUND'
  | 'INVALID_ANSWER_OPTION'
  | 'ANTI_CHEAT_VIOLATION';

export class TestingException extends HttpException {
  constructor(
    public readonly code: TestingErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ code, message }, status);
  }
}
