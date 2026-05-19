import { UserRole } from '@edu-platform/shared';
import { ROLE_HOME } from './constants';

export function getHomeRouteForRole(role: UserRole | string): string {
  return ROLE_HOME[role] ?? '/';
}

export function isTeacherRole(role: UserRole | string): boolean {
  return role === UserRole.TEACHER || role === UserRole.ADMIN;
}

export function isStudentRole(role: UserRole | string): boolean {
  return role === UserRole.STUDENT || role === UserRole.ADMIN;
}
