'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@edu-platform/shared';
import { getHomeRouteForRole } from '@/lib/auth/redirect';
import { PageLoading } from '@/components/feedback';
import { useAuth } from '@/hooks/use-auth';

export function RoleGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}) {
  const router = useRouter();
  const { user, isSessionLoading } = useAuth();

  useEffect(() => {
    if (isSessionLoading || !user) return;
    if (!allowedRoles.includes(user.role as UserRole)) {
      router.replace(getHomeRouteForRole(user.role));
    }
  }, [allowedRoles, isSessionLoading, router, user]);

  if (isSessionLoading || !user) {
    return <PageLoading />;
  }

  if (!allowedRoles.includes(user.role as UserRole)) {
    return <PageLoading label="Redirecting" />;
  }

  return <>{children}</>;
}
