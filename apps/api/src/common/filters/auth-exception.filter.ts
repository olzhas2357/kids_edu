import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { AuthException } from '@/modules/auth/exceptions/auth.exception';

@Catch(AuthException)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: AuthException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(exception.getStatus()).json({
      success: false,
      statusCode: exception.getStatus(),
      code: exception.code,
      message: exception.message,
    });
  }
}
