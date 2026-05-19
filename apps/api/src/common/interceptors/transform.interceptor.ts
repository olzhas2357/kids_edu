import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, { success: true; data: T }> {
  intercept(_context: ExecutionContext, next: CallHandler<T>) {
    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data,
      })),
    );
  }
}
