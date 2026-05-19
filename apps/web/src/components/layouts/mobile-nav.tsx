'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/config/navigation';
import { BRAND } from '@/config/navigation';
import { NavIcon } from '@/components/navigation/nav-icon';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/stores';

export function MobileNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { mobileNavOpen, setMobileNavOpen } = useUiStore();
  return (
    <>
      <header className="flex h-14 items-center justify-between border-b px-4 lg:hidden">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <NavIcon name={BRAND.icon} className="text-primary h-6 w-6" />
          {BRAND.name}
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
          {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {mobileNavOpen ? (
        <nav className="border-b bg-white p-3 lg:hidden">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  'mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                  active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                )}
              >
                <NavIcon name={item.icon} className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </>
  );
}
