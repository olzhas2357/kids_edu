import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '@/common/types';
import { StudentProgressService } from '../services/student-progress.service';

@Injectable()
export class StudentTopicAccessGuard implements CanActivate {
  constructor(private readonly progressService: StudentProgressService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user: AuthUser;
      params: { topicId: string };
    }>();

    if (request.user.role === Role.ADMIN) {
      return true;
    }

    await this.progressService.assertTopicUnlocked(
      request.params.topicId,
      request.user.id,
    );
    return true;
  }
}
