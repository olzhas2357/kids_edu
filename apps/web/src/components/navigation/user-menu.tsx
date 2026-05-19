'use client';

import { LogOut } from 'lucide-react';
import { ROLE_LABELS, type UserRole } from '@edu-platform/shared';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const roleLabel = ROLE_LABELS[user.role as UserRole] ?? user.role;

  return (
    <section className="border-t p-4">
      <section className="mb-3 flex items-center gap-3">
        <Avatar name={user.displayName} size="sm" />
        <section className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.displayName}</p>
          <p className="text-muted-foreground truncate text-xs">{roleLabel}</p>
        </section>
      </section>
      <Button variant="outline" size="sm" className="w-full" onClick={() => logout()}>
        <LogOut className="mr-2 h-4 w-4" />
        Sign out
      </Button>
    </section>
  );
}
