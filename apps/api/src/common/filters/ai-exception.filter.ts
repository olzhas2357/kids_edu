import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AiException } from '@/modules/ai/exceptions/ai.exception';

@Catch(AiException)
export class AiExceptionFilter implements ExceptionFilter {
  catch(exception: AiException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus() as HttpStatus;

    response.status(status).json({
      success: false,
      statusCode: status,
      code: exception.code,
      message: exception.message,
    });
  }
}
