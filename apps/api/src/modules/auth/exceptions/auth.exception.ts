import { HttpException, HttpStatus } from '@nestjs/common';

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_ALREADY_EXISTS'
  | 'USER_INACTIVE'
  | 'INVALID_REFRESH_TOKEN'
  | 'REFRESH_TOKEN_REVOKED'
  | 'ADMIN_REGISTRATION_FORBIDDEN';

export class AuthException extends HttpException {
  constructor(
    public readonly code: AuthErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.UNAUTHORIZED,
  ) {
    super({ code, message }, status);
  }
}
