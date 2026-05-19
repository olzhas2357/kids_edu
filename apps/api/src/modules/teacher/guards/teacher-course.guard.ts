import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthUser } from '@/common/types';
import { TeacherOwnershipService } from '../services/teacher-ownership.service';

@Injectable()
export class TeacherCourseGuard implements CanActivate {
  constructor(private readonly ownership: TeacherOwnershipService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user: AuthUser;
      params: { courseId?: string };
    }>();
    const courseId = request.params.courseId;
    if (!courseId) {
      return true;
    }
    if (request.user.role === Role.ADMIN) {
      return true;
    }
    await this.ownership.assertCourseOwnership(courseId, request.user.id);
    return true;
  }
}
