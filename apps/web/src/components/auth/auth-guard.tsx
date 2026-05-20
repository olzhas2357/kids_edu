'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WEB_ROUTES } from '@edu-platform/shared';
import { PageLoading } from '@/components/feedback';
import { useAuthStore } from '@/stores';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`${WEB_ROUTES.LOGIN}?from=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [status, router]);

  if (status === 'loading') {
    return <PageLoading label="Checking session" />;
  }

  if (status === 'idle' || !isAuthenticated) {
    return <PageLoading label="Redirecting to login" />;
  }

  return <>{children}</>;
}
