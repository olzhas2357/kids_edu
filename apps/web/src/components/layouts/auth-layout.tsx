import Link from 'next/link';
import { BRAND } from '@/config/navigation';
import { NavIcon } from '@/components/navigation/nav-icon';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      <section className="bg-primary text-primary-foreground hidden flex-1 flex-col justify-between p-10 lg:flex">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <NavIcon name={BRAND.icon} className="h-8 w-8" />
          {BRAND.name}
        </Link>
        <blockquote className="max-w-md text-lg leading-relaxed">
          Learn step by step — theory, videos, practice, and friendly AI hints.
        </blockquote>
        <p className="text-sm opacity-80">For children 8–10 years</p>
      </section>
      <section className="flex flex-1 items-center justify-center p-6">{children}</section>
    </main>
  );
}
