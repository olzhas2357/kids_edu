import { HttpException, HttpStatus } from '@nestjs/common';

export type AiErrorCode =
  | 'AI_DISABLED'
  | 'AI_RATE_LIMITED'
  | 'AI_MODERATION_BLOCKED'
  | 'AI_INVALID_RESPONSE'
  | 'AI_PROVIDER_ERROR'
  | 'AI_NOT_CONFIGURED';

export class AiException extends HttpException {
  constructor(
    public readonly code: AiErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ code, message }, status);
  }
}
