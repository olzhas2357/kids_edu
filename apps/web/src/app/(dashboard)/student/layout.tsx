import { UserRole } from '@edu-platform/shared';
import { RoleGuard } from '@/components/auth/role-guard';
import { AppShell } from '@/components/layouts/app-shell';
import { STUDENT_NAV } from '@/config/navigation';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={[UserRole.STUDENT, UserRole.ADMIN]}>
      <AppShell navItems={STUDENT_NAV}>{children}</AppShell>
    </RoleGuard>
  );
}
