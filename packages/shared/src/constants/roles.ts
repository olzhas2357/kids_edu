import { UserRole } from '../types/user.types';

export const USER_ROLES = [UserRole.TEACHER, UserRole.STUDENT, UserRole.ADMIN] as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.TEACHER]: 'Teacher',
  [UserRole.STUDENT]: 'Student',
  [UserRole.ADMIN]: 'Admin',
};
