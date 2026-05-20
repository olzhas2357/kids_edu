import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { TestingException } from '@/modules/testing/exceptions/testing.exception';

@Catch(TestingException)
export class TestingExceptionFilter implements ExceptionFilter {
  catch(exception: TestingException, host: ArgumentsHost) {
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
