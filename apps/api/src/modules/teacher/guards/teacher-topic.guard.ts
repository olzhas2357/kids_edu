import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '@/common/types';
import { TeacherOwnershipService } from '../services/teacher-ownership.service';

@Injectable()
export class TeacherTopicGuard implements CanActivate {
  constructor(private readonly ownership: TeacherOwnershipService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user: AuthUser;
      params: { topicId?: string };
    }>();
    const topicId = request.params.topicId;
    if (!topicId) {
      return true;
    }
    if (request.user.role === Role.ADMIN) {
      return true;
    }
    await this.ownership.assertTopicOwnership(topicId, request.user.id);
    return true;
  }
}
