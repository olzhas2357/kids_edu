import { UserRole } from '@edu-platform/shared';
import { RoleGuard } from '@/components/auth/role-guard';
import { AppShell } from '@/components/layouts/app-shell';
import { TEACHER_NAV } from '@/config/navigation';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={[UserRole.TEACHER, UserRole.ADMIN]}>
      <AppShell navItems={TEACHER_NAV}>{children}</AppShell>
    </RoleGuard>
  );
}
