'use client';

import Link from 'next/link';
import type { NavItem } from '@/config/navigation';
import { BRAND } from '@/config/navigation';
import { NavIcon } from '@/components/navigation/nav-icon';
import { SidebarNav } from '@/components/navigation/sidebar-nav';
import { UserMenu } from '@/components/navigation/user-menu';
import { MobileNav } from './mobile-nav';

export function AppShell({
  children,
  navItems,
}: {
  children: React.ReactNode;
  navItems: NavItem[];
}) {
  return (
    <section className="bg-muted/30 flex min-h-screen flex-col lg:flex-row">
      <MobileNav items={navItems} />

      <aside className="bg-background hidden w-64 shrink-0 flex-col border-r lg:flex">
        <Link href="/" className="flex h-16 items-center gap-2 border-b px-6 font-semibold">
          <NavIcon name={BRAND.icon} className="text-primary h-7 w-7" />
          {BRAND.name}
        </Link>
        <SidebarNav items={navItems} />
        <UserMenu />
      </aside>

      <main className="flex-1 overflow-auto">
        <section className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">{children}</section>
      </main>
    </section>
  );
}
